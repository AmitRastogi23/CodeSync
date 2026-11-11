import express from "express";
import cors from "cors";

import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import "./config/passport.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import quesRoutes from "./routes/question.js";
import sessionRoutes from "./routes/session.js";

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Setup
export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "codesync_super_secret_key",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL,
    collectionName: "sessions",
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    secure: true,
    sameSite: "none",
  },
});

app.use(sessionMiddleware);

// Passport Initialize
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/questions", quesRoutes);
app.use("/api/sessions", sessionRoutes);

app.get("/", (req, res) => {
  res.send("CodeSync Backend API is running........");
});

export default app;
