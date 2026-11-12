import express from "express";
import bcrypt from "bcryptjs";
import passport from "passport";
import crypto from "crypto";
import speakeasy from "speakeasy";
import User from "../models/User.js";
import redis from "../config/redis.js";
import {
  sendOTPEmail,
  sendResetOTPEmail,
  sendWelcomeEmail,
  sendPasswordChangedEmail,
} from "../config/mailer.js";

import {
  loginLimiter,
  verify2FALimiter,
  verifyOTPLimiter,
  verifyResetOTPLimiter,
} from "../middleware/rateLimiter.js";

const router = express.Router();

// register new user and get OTP
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 1. RATE LIMITER (60 sec Cooldown)
    const cooldownKey = `signup_cooldown:${email}`;
    const isCooldown = await redis.get(cooldownKey);
    if (isCooldown) {
      return res.status(429).json({
        message: "Please wait 60 seconds before requesting a new OTP.",
      });
    }

    // 2. RATE LIMITER (Daily Limit - Max 10)
    const dailyKey = `signup_daily:${email}`;
    const dailyCount = await redis.get(dailyKey);
    if (dailyCount && parseInt(dailyCount) >= 10) {
      return res
        .status(429)
        .json({ message: "Daily limit reached. Try again tomorrow." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Check if pending data exists in Redis (Resend Case)
    const redisKey = `signup:${email}`;
    let redisData = await redis.get(redisKey);
    let userData;

    if (redisData) {
      // Agar data pehle se hai (Resend case), toh naya password hash mat banao
      const parsedData = JSON.parse(redisData);
      userData = {
        name: parsedData.name,
        email,
        hashedPassword: parsedData.hashedPassword,
      };
    } else {
      // Agar naya signup hai, toh password hash karo
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      userData = { name, email, hashedPassword };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to Redis (Expires in 5 minutes)
    await redis.setex(redisKey, 300, JSON.stringify({ ...userData, otp }));

    // Send Email
    await sendOTPEmail(email, userData.name, otp);

    // 3. SET RATE LIMIT KEYS
    await redis.setex(cooldownKey, 60, "true");

    if (dailyCount) {
      await redis.incr(dailyKey);
    } else {
      await redis.setex(dailyKey, 86400, 1); // 24 hours
    }

    res.status(200).json({ message: "OTP sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. VERIFY OTP (Signup Step 2)
router.post("/verify-otp", verifyOTPLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP required" });
    }

    // Get data from Redis
    const redisData = await redis.get(`signup:${email}`);
    if (!redisData) {
      return res.status(400).json({ message: "OTP expired or invalid email" });
    }

    const { name, hashedPassword, otp: savedOtp } = JSON.parse(redisData);

    // Check OTP
    if (otp !== savedOtp) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    // Create User in MongoDB
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Delete from Redis (cleanup)
    await redis.del(`signup:${email}`);

    try {
      await sendWelcomeEmail(newUser.email, newUser.name);
    } catch (mailErr) {
      console.error("Welcome mail failed:", mailErr);
    }

    // Auto-login
    req.login(newUser, (err) => {
      if (err) return res.status(500).json({ message: "Error logging in" });
      return res.status(201).json({
        message: "Account created successfully",
        user: { id: newUser._id, name: newUser.name, email: newUser.email },
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// login user through local strategy
router.post("/login", loginLimiter, (req, res, next) => {
  const { rememberMe } = req.body;
  passport.authenticate("local", async (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res
        .status(401)
        .json({ message: info.message || "Invalid credentials" });
    }

    if (user.isTwoFactorEnabled) {
      const tempToken = crypto.randomBytes(32).toString("hex");

      // Redis me save karo (5 min expiry) -> value me userId aur rememberMe save karo
      await redis.setex(
        `2fa_login:${tempToken}`,
        300,
        JSON.stringify({ userId: user._id, rememberMe }),
      );

      return res.status(200).json({
        requires2FA: true,
        tempToken: tempToken,
        message: "Please enter your 2FA code",
      });
    }

    req.login(user, (err) => {
      if (err) return next(err);

      // remembering the user for 7 days
      if (rememberMe) {
        req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 7;
      } else {
        req.session.cookie.maxAge = 1000 * 60 * 60 * 24;
      }

      return res.status(200).json({
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          photo: user.photo,
          isTwoFactorEnabled: user.isTwoFactorEnabled,
        },
      });
    });
  })(req, res, next);
});

// VERIFY 2FA LOGIN
router.post("/verify-2fa", verify2FALimiter, async (req, res, next) => {
  try {
    const { tempToken, token } = req.body;
    if (!tempToken || !token) {
      return res.status(400).json({ message: "Token and code required" });
    }

    // Redis se data nikaalo
    const redisData = await redis.get(`2fa_login:${tempToken}`);
    if (!redisData) {
      return res
        .status(400)
        .json({ message: "Session expired. Please login again." });
    }

    const { userId, rememberMe } = JSON.parse(redisData);

    // User DB se nikaalo
    const user = await User.findById(userId);
    if (!user || !user.twoFactorSecret) {
      return res
        .status(400)
        .json({ message: "Invalid user or 2FA not set up" });
    }

    // Verify TOTP
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({ message: "Invalid 2FA code" });
    }

    await redis.del(`2fa_login:${tempToken}`);

    // Ab final login karo
    req.login(user, (err) => {
      if (err) return next(err);
      if (rememberMe) {
        req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 7;
      } else {
        req.session.cookie.maxAge = 1000 * 60 * 60 * 24;
      }
      return res.status(200).json({
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          photo: user.photo,
          isTwoFactorEnabled: user.isTwoFactorEnabled,
        },
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user;

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photo: user.photo,
        googleId: user.googleId,
        githubId: user.githubId,
        isTwoFactorEnabled: user.isTwoFactorEnabled || false,
        hasPassword: !!user.password,
      },
    });
  }
  return res.status(401).json({ message: "Not authenticated" });
});

router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.status(200).json({ message: "Logged out successfully" });
  });
});

// FORGOT PASSWORD (Send Reset OTP)
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // RATE LIMITER: 60 Second Cooldown Check
    const cooldownKey = `cooldown:${email}`;
    const isCooldown = await redis.get(cooldownKey);
    if (isCooldown) {
      return res.status(429).json({
        message: "Please wait 60 seconds before requesting a new OTP.",
      });
    }

    // RATE LIMITER: Daily Limit (Max 10 per day)
    const dailyKey = `daily_limit:${email}`;
    const dailyCount = await redis.get(dailyKey);
    if (dailyCount && parseInt(dailyCount) >= 10) {
      return res.status(429).json({
        message:
          "Daily limit reached. You can request a maximum of 10 OTPs per day.",
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ message: "User with this email not found" });

    // Generate OTP and save to Redis (5 min expiry)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis.setex(`reset:${email}`, 300, otp);

    // Send email
    await sendResetOTPEmail(email, user.name, otp);

    // SET RATE LIMIT KEYS IN REDIS
    // Set 60 second cooldown
    await redis.setex(cooldownKey, 60, "true");

    // Increment daily count (Expires in 24 hours = 86400 seconds)
    if (dailyCount) {
      await redis.incr(dailyKey);
    } else {
      await redis.setex(dailyKey, 86400, 1);
    }

    res.status(200).json({ message: "Reset OTP sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// VERIFY RESET OTP
router.post("/verify-reset-otp", verifyResetOTPLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP required" });

    const savedOtp = await redis.get(`reset:${email}`);

    if (!savedOtp)
      return res.status(400).json({ message: "OTP expired or invalid email" });
    if (savedOtp !== otp)
      return res.status(400).json({ message: "Incorrect OTP" });

    // OTP sahi hai, ab ise verify mark kar do (taaki reset-password route isko check kar sake)
    await redis.setex(`reset_verified:${email}`, 600, "true"); // 10 min tak valid

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword)
      return res
        .status(400)
        .json({ message: "Email and new password required" });

    // Check karo ki OTP pehle verify hua tha kya
    const isVerified = await redis.get(`reset_verified:${email}`);
    if (!isVerified)
      return res
        .status(403)
        .json({ message: "Unauthorized: Please verify OTP first" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update DB
    user.password = hashedPassword;
    await user.save();

    // Cleanup Redis
    await redis.del(`reset:${email}`);
    await redis.del(`reset_verified:${email}`);

    try {
      await sendPasswordChangedEmail(user.email, user.name);
    } catch (mailErr) {
      console.error("Password change mail failed:", mailErr);
    }

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GOOGLE OAUTH ROUTES
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
  }),
  async (req, res) => {
    if (req.user.isTwoFactorEnabled) {
      const tempToken = crypto.randomBytes(32).toString("hex");

      await redis.setex(
        `2fa_login:${tempToken}`,
        300,
        JSON.stringify({ userId: req.user._id, rememberMe: false }),
      );

      return res.redirect(
        `${process.env.CLIENT_URL}/login?2fa=true&token=${tempToken}`,
      );
    }

    res.redirect(`${process.env.CLIENT_URL}/`);
  },
);

// GITHUB OAUTH ROUTE
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] }),
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
  }),
  async (req, res) => {
    if (req.user.isTwoFactorEnabled) {
      const tempToken = crypto.randomBytes(32).toString("hex");

      await redis.setex(
        `2fa_login:${tempToken}`,
        300,
        JSON.stringify({ userId: req.user._id, rememberMe: false }),
      );

      return res.redirect(
        `${process.env.CLIENT_URL}/login?2fa=true&token=${tempToken}`,
      );
    } else {
      res.redirect(`${process.env.CLIENT_URL}/`);
    }
  },
);

// CONNECT ROUTES (Settings/Connected Apps Ke Liye)
router.get(
  "/google/connect",
  (req, res, next) => {
    if (!req.isAuthenticated())
      return res.redirect(`${process.env.CLIENT_URL}/login`);
    next();
  },
  passport.authenticate("google", {
    scope: ["profile", "email"],
    callbackURL: `${process.env.SERVER_URL}/api/auth/google/connect/callback`,
  }),
);

router.get(
  "/google/connect/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/settings/security?error=connect_failed`,
    callbackURL: `${process.env.SERVER_URL}/api/auth/google/connect/callback`,
  }),
  (req, res) => {
    res.redirect(
      `${process.env.CLIENT_URL}/settings/security?connected=google`,
    );
  },
);

router.get(
  "/github/connect",
  (req, res, next) => {
    if (!req.isAuthenticated())
      return res.redirect(`${process.env.CLIENT_URL}/login`);
    next();
  },
  passport.authenticate("github", {
    scope: ["user:email"],
    callbackURL: `${process.env.SERVER_URL}/api/auth/github/connect/callback`,
  }),
);

router.get(
  "/github/connect/callback",
  passport.authenticate("github", {
    failureRedirect: `${process.env.CLIENT_URL}/settings/security?error=connect_failed`,
    callbackURL: `${process.env.SERVER_URL}/api/auth/github/connect/callback`,
  }),
  (req, res) => {
    res.redirect(
      `${process.env.CLIENT_URL}/settings/security?connected=github`,
    );
  },
);

export default router;
