import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { upload } from "../config/cloudinary.js";
import cloudinary from "../config/cloudinary.js";
import crypto from "crypto";
import redis from "../config/redis.js";

import Session from "../models/Session.js";
import SessionNote from "../models/SessionNote.js";
import CodeSubmission from "../models/CodeSubmission.js";
import Question from "../models/Questions.js";

import {
  sendPasswordChangedEmail,
  send2FAStatusEmail,
  sendDeleteAccountOTP,
  sendAccountDeletedEmail,
} from "../config/mailer.js";

const router = express.Router();

import {
  disable2FALimiter,
  changePasswordLimiter,
} from "../middleware/rateLimiter.js";

const isLoggedIn = (req, res, next) => {
  if (!req.user)
    return res.status(401).json({ message: "Unauthorized! Please Login." });
  next();
};

// UPDATE PROFILE (Name)
router.patch("/profile", isLoggedIn, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Name cannot be empty" });
    }

    // 2. Update the user in DB using the ID from the session (req.user._id)
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true, runValidators: true }, // new: true returns the updated document
    ).select("-password"); // Password field ko response se hata diya

    // 3. Send success response
    res.status(200).json({
      message: "Profile name updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Server error while updating profile" });
  }
});

// UPDATE / ADD PASSWORD
router.patch(
  "/password",
  isLoggedIn,
  changePasswordLimiter,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ message: "New password is required" });
      }

      // DB se user nikaalo
      const user = await User.findById(req.user._id);

      // Agar user ke paas pehle se password hai (Local user)
      if (user.password) {
        if (!currentPassword) {
          return res
            .status(400)
            .json({ message: "Current password is required" });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res
            .status(400)
            .json({ message: "Incorrect current password" });
        }
      }

      // Naya password hash karo aur save karo
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      try {
        await sendPasswordChangedEmail(user.email, user.name);
      } catch (mailErr) {
        console.error("Password change alert mail failed:", mailErr);
      }

      res.status(200).json({
        message: "Password updated successfully",
        user: user,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// GENERATE 2FA SECRET & QR CODE
router.post("/2fa/generate", async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized! Please Login." });

    // 1. Secret Generate karo
    const secret = speakeasy.generateSecret({
      name: `CodeSync (${req.user.email})`, // Authenticator app me ye naam dikhega
    });

    // 2. Secret ko User DB me save karo (abhi isTwoFactorEnabled false rahega)
    await User.findByIdAndUpdate(req.user._id, {
      twoFactorSecret: secret.base32,
    });

    // 3. QR Code generate karo (Frontend isko <img> me dikhayega)
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      message: "QR Code generated",
      qrCode: qrCodeUrl, // Base64 image
      secret: secret.base32, // Manual entry ke liye (agar QR scan na ho)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// VERIFY AND ENABLE 2FA
router.post("/2fa/verify", async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized! Please Login." });

    const { token } = req.body; // User ka 6-digit code

    const user = await User.findById(req.user._id);
    if (!user.twoFactorSecret) {
      return res
        .status(400)
        .json({ message: "Two Factor Authentication setup not initiated" });
    }

    // Verify code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token,
      window: 1,
    });

    if (verified) {
      user.isTwoFactorEnabled = true;
      await user.save();

      try {
        await send2FAStatusEmail(user.email, user.name, true);
      } catch (mailErr) {
        console.error("2FA Enable mail failed:", mailErr);
      }

      const userToSend = user.toObject();
      delete userToSend.password;
      delete userToSend.twoFactorSecret;

      res.status(200).json({
        message: "Two Factor Authentication enabled successfully",
        user: userToSend,
      });
    } else {
      res.status(400).json({ message: "Invalid code. Please try again." });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DISABLE 2FA
router.post("/2fa/disable", disable2FALimiter, async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Unauthorized! Please Login." });

    const { token } = req.body;
    if (!token) {
      return res
        .status(400)
        .json({ message: "Authenticator code is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user.isTwoFactorEnabled || !user.twoFactorSecret) {
      return res
        .status(400)
        .json({ message: "Two Factor Authentication is not enabled" });
    }

    // Verify TOTP Token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token,
      window: 1, // 30 sec window
    });

    if (!verified) {
      return res
        .status(400)
        .json({ message: "Invalid code. Please try again." });
    }

    // Disable 2FA and remove secret
    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();

    try {
      await send2FAStatusEmail(user.email, user.name, false);
    } catch (mailErr) {
      console.error("2FA Disable mail failed:", mailErr);
    }

    // Updated user response
    const userToSend = user.toObject();
    delete userToSend.password;
    delete userToSend.twoFactorSecret;

    res.status(200).json({
      message: "Two Factor Authentication disabled successfully",
      user: userToSend,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPLOAD PROFILE PHOTO
router.post(
  "/upload-photo",
  isLoggedIn,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const user = await User.findById(req.user._id);

      // Purani photo delete karo (agar Cloudinary wali hai)
      if (user.photoPublicId) {
        cloudinary.uploader
          .destroy(user.photoPublicId)
          .catch((err) =>
            console.log("Purani photo delete fail:", err.message),
          );
      }

      user.photo = req.file.path; // Multer-storage-cloudinary URL deta hai
      user.photoPublicId = req.file.filename;
      await user.save();

      res.status(200).json({
        message: "Profile photo updated successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          photo: user.photo,
          isTwoFactorEnabled: user.isTwoFactorEnabled,
          hasPassword: !!user.password,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// REMOVE PROFILE PHOTO
router.delete("/remove-photo", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.photoPublicId) {
      await cloudinary.uploader.destroy(user.photoPublicId);
    }

    user.photo = "";
    user.photoPublicId = "";
    await user.save();

    res.status(200).json({
      message: "Profile photo removed successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photo: user.photo,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
        hasPassword: !!user.password,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 1. REQUEST ACCOUNT DELETION (Send OTP or use 2FA)
router.post("/delete-account/request", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.isTwoFactorEnabled) {
      // Agar 2FA on hai, toh frontend ko batao ki 2FA code maango
      return res.status(200).json({
        type: "2FA",
        message: "Please enter your 2FA code to confirm account deletion.",
      });
    } else {
      // Agar 2FA off hai, toh OTP bhejo
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await redis.setex(`delete_otp:${user._id}`, 300, otp); // 5 min expiry
      await sendDeleteAccountOTP(user.email, user.name, otp);

      return res.status(200).json({
        type: "OTP",
        message: "An OTP has been sent to your email.",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. CONFIRM ACCOUNT DELETION (Verify code & Anonymize)
router.post("/delete-account/confirm", isLoggedIn, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id);

    if (!code) return res.status(400).json({ message: "Code is required" });

    // 1. Verification (2FA ya OTP)
    if (user.isTwoFactorEnabled) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: code,
        window: 1,
      });
      if (!verified)
        return res.status(400).json({ message: "Invalid 2FA code" });
    } else {
      const savedOtp = await redis.get(`delete_otp:${user._id}`);
      if (!savedOtp || savedOtp !== code) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      await redis.del(`delete_otp:${user._id}`);
    }

    // 2. Cascade Delete (Interviewer ke sessions delete karo)
    const userSessions = await Session.find({ interviewer: user._id });
    const sessionIds = userSessions.map((s) => s._id);

    if (sessionIds.length > 0) {
      // Delete notes and submissions for those sessions
      await SessionNote.deleteMany({ sessionId: { $in: sessionIds } });
      await CodeSubmission.deleteMany({ sessionId: { $in: sessionIds } });
      // Delete the sessions
      await Session.deleteMany({ interviewer: user._id });
    }

    // 3. Questions ko archive kar do (Owner ke liye)
    await Question.updateMany(
      { createdBy: user._id },
      { isArchivedByOwner: true },
    );

    // 4. User ko Anonymize karo (Hard delete nahi)
    const uniqueId = crypto.randomBytes(4).toString("hex");
    const originalEmail = user.email; // Mail bhejne ke liye save karo

    user.name = "Deleted User";
    user.email = `deleted_${uniqueId}@codesync.com`;
    user.password = null;
    user.googleId = null;
    user.githubId = null;
    user.photo = "";
    user.photoPublicId = "";
    user.twoFactorSecret = null;
    user.isTwoFactorEnabled = false;

    await user.save();

    // 5. Final Mail bhejo
    try {
      await sendAccountDeletedEmail(originalEmail, "User");
    } catch (e) {
      console.error("Final mail failed", e);
    }

    // 6. Logout
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Error logging out" });
      res.status(200).json({ message: "Account deleted successfully" });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
