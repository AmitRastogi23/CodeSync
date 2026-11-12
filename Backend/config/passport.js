import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";

import bcrypt from "bcryptjs";
import User from "../models/User.js";

import { sendAccountConnectedEmail, sendWelcomeEmail } from "./mailer.js";

const cleanPhotoUrl = (url) => {
  if (!url) return "";
  return url.replace(/'/g, "");
};

// 1. LOCAL STRATEGY (Email + Password)
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          return done(null, false, { message: "User not found" });
        }

        if (!user.password) {
          return done(null, false, {
            message: "Please login with Google or GitHub",
          });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password" });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

// 2. GOOGLE STRATEGY
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const photoUrl = cleanPhotoUrl(profile.photos?.[0]?.value);

        // connect google id if user is logged in
        if (req.user) {
          const currentUser = await User.findById(req.user._id);
          if (!currentUser) {
            return done(null, false, { message: "User not found" });
          }

          // Check karo ki ye Google ID kisi aur user se toh link nahi hai
          const existingLink = await User.findOne({ googleId: profile.id });
          if (
            existingLink &&
            existingLink._id.toString() !== currentUser._id.toString()
          ) {
            return done(null, false, { message: "already_linked" });
          }

          // Link kar do
          currentUser.googleId = profile.id;
          if (!currentUser.photo && photoUrl) {
            currentUser.photo = photoUrl;
          }
          await currentUser.save();

          try {
            await sendAccountConnectedEmail(
              currentUser.email,
              currentUser.name,
              "google",
              profile.emails[0].value,
            );
          } catch (mailErr) {
            console.error("Mail send failed:", mailErr);
          }

          return done(null, currentUser);
        }

        // create new google account or link google Id if user is logged out
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.findOne({ email: profile.emails[0].value });
          if (user) {
            user.googleId = profile.id;
            if (!user.photo && photoUrl) {
              user.photo = photoUrl;
            }
            await user.save();
          } else {
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              photo: photoUrl,
            });

            try {
              await sendWelcomeEmail(user.email, user.name);
            } catch (mailErr) {
              console.error("Welcome mail failed:", mailErr);
            }
          }
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

// 3. GITHUB STRATEGY
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/api/auth/github/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const photoUrl = cleanPhotoUrl(profile.photos?.[0]?.value);
        const email = profile.emails?.[0]?.value;

        // 👇 NAYA LOGIC: Connect flow
        if (req.user) {
          const currentUser = await User.findById(req.user._id);
          if (!currentUser) {
            return done(null, false, { message: "User not found" });
          }

          const existingLink = await User.findOne({ githubId: profile.id });
          if (
            existingLink &&
            existingLink._id.toString() !== currentUser._id.toString()
          ) {
            return done(null, false, { message: "already_linked" });
          }

          currentUser.githubId = profile.id;
          if (!currentUser.photo && photoUrl) {
            currentUser.photo = photoUrl;
          }
          await currentUser.save();

          try {
            await sendAccountConnectedEmail(
              currentUser.email,
              currentUser.name,
              "github",
              email || profile.username,
            );
          } catch (mailErr) {
            console.error("Mail send failed:", mailErr);
          }

          return done(null, currentUser);
        }

        // 👇 PURANA LOGIC
        let user = await User.findOne({ githubId: profile.id });
        if (!user) {
          if (email) user = await User.findOne({ email });
          if (user) {
            user.githubId = profile.id;
            if (!user.photo && photoUrl) {
              user.photo = photoUrl;
            }
            await user.save();
          } else {
            user = await User.create({
              githubId: profile.id,
              name: profile.displayName || profile.username,
              email: email || `${profile.username}@github.placeholder`,
              photo: photoUrl,
            });

            try {
              await sendWelcomeEmail(user.email, user.name);
            } catch (mailErr) {
              console.error("Welcome mail failed:", mailErr);
            }
          }
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

// SERIALIZE & DESERIALIZE
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
