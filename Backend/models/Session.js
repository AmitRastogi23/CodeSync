import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  interviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  candidateEmail: {
    type: String,
    required: true,
  },
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
    },
  ],
  scheduledAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["upcoming", "live", "completed", "expired", "cancelled"],
    default: "upcoming",
  },
  violations: [
    {
      type: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Session = mongoose.model("Session", sessionSchema, "interview_sessions");
export default Session;
