import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // Basic info
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  photo: { type: String, default: "" },
  photoPublicId: { type: String, default: "" },

  // Local auth only
  password: { type: String }, // bcrypt hash, OAuth users ke liye null

  // OAuth providers
  googleId: { type: String, sparse: true },
  githubId: { type: String, sparse: true },

  twoFactorSecret: { type: String },
  isTwoFactorEnabled: { type: Boolean, default: false },

  // Meta
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

export default User;
