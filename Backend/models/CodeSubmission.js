import mongoose from "mongoose";

const codeSubmissionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    roomId: {
      type: String,
      required: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    passedCount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalCount: {
      type: Number,
      required: true,
      default: 0,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// 👇 Ek session + ek question ka sirf ek entry — upsert ke liye unique index
codeSubmissionSchema.index({ sessionId: 1, questionId: 1 }, { unique: true });

// 👇 Query fast karne ke liye
codeSubmissionSchema.index({ roomId: 1 });
codeSubmissionSchema.index({ sessionId: 1 });

const CodeSubmission = mongoose.model(
  "CodeSubmission",
  codeSubmissionSchema,
  "code_submissions",
);

export default CodeSubmission;
