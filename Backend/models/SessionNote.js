import mongoose from "mongoose";

const sessionNoteSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
      unique: true,
    },
    roomId: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: "",
      maxlength: 20000,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

sessionNoteSchema.index({ roomId: 1 });

const SessionNote = mongoose.model(
  "SessionNote",
  sessionNoteSchema,
  "session_notes",
);

export default SessionNote;
