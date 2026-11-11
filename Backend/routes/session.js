import express from "express";
import crypto from "crypto";
import Session from "../models/Session.js";
import Question from "../models/Questions.js";
import SessionNote from "../models/SessionNote.js";
import CodeSubmission from "../models/CodeSubmission.js";
import {
  sendInterviewInviteEmail,
  sendInterviewRescheduleEmail,
  sendInterviewCancelledEmail,
} from "../config/mailer.js";

const router = express.Router();

const isLoggedIn = (req, res, next) => {
  if (!req.user)
    return res.status(401).json({
      title: "Unauthorized Access",
      message: "You must be logged in to join this room.",
    });
  next();
};

// 1. CREATE SESSION
router.post("/create", isLoggedIn, async (req, res) => {
  try {
    const { candidateEmail, questionIds, scheduledAt } = req.body;

    if (!candidateEmail || !questionIds || questionIds.length === 0) {
      return res.status(400).json({
        message: "Candidate email and at least one question are required",
      });
    }

    // Saare questions check karo ki usi user ke hain
    const questions = await Question.find({ _id: { $in: questionIds } });

    if (questions.length !== questionIds.length) {
      return res.status(400).json({ message: "Some questions are invalid" });
    }

    const userEmail = (req.user.email || "").toLowerCase().trim();
    const userId = req.user._id.toString();

    const allAccessible = questions.every((q) => {
      const isOwner = q.createdBy.toString() === userId;
      const isShared = q.sharedWith.some((s) => s.email === userEmail);
      return isOwner || isShared;
    });

    if (!allAccessible) {
      return res.status(400).json({
        message: "You do not have access to some of the selected questions.",
      });
    }

    const roomId = `room_${crypto.randomBytes(4).toString("hex")}`;

    const newSession = await Session.create({
      roomId,
      interviewer: req.user._id,
      candidateEmail,
      questions: questionIds,
      scheduledAt: scheduledAt || Date.now(),
      status: "upcoming",
    });

    // Email me sirf invite link bhejo, question title nahi
    const joinLink = `${process.env.CLIENT_URL}/join/${roomId}`;
    await sendInterviewInviteEmail(
      candidateEmail,
      req.user.name,
      joinLink,
      scheduledAt,
    );

    res.status(201).json({
      message: "Session created and email sent",
      session: newSession,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. GET MY SESSIONS
router.get("/my", isLoggedIn, async (req, res) => {
  try {
    const sessions = await Session.find({ interviewer: req.user._id })
      .populate("questions", "title difficulty")
      .sort({ createdAt: -1 });

    res.status(200).json({ sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 3. JOIN SESSION (Waiting Room Verify)
router.get("/join/:roomId", isLoggedIn, async (req, res) => {
  try {
    const { roomId } = req.params;

    const session = await Session.findOne({ roomId }).populate(
      "interviewer",
      "name email",
    );

    // 1. Room exists?
    if (!session) {
      return res.status(404).json({
        title: "Invalid Room",
        message: "This interview room does not exist.",
      });
    }

    // 2. Already ended?
    if (session.status === "completed") {
      return res.status(400).json({
        title: "Interview Ended",
        message: "This interview has already ended.",
      });
    }

    // 3. Candidate email match
    const userEmail = (req.user?.email || "").toLowerCase().trim();
    const candidateEmail = (session.candidateEmail || "").toLowerCase().trim();

    if (!userEmail || userEmail !== candidateEmail) {
      return res.status(403).json({
        title: "Access Denied",
        message: "Only the invited candidate can access this waiting room.",
      });
    }

    res.status(200).json({
      session: {
        roomId: session.roomId,
        interviewerName: session.interviewer.name,
        status: session.status,
        scheduledAt: session.scheduledAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      title: "Server Error",
      message: "Something went wrong. Please try again later.",
    });
  }
});

// 4. GET INTERVIEW ROOM DATA (With Questions)
router.get("/interview/:roomId", isLoggedIn, async (req, res) => {
  try {
    const { roomId } = req.params;

    const session = await Session.findOne({ roomId })
      .populate("interviewer", "name email")
      .populate("questions");

    if (!session) {
      return res.status(404).json({
        title: "Invalid Room",
        message: "This interview room does not exist.",
      });
    }

    if (session.status === "completed") {
      return res.status(400).json({
        title: "Interview Ended",
        message: "This interview has already ended.",
      });
    }

    const userId = req.user._id.toString();
    const userEmail = (req.user.email || "").toLowerCase().trim();

    const isInterviewer = session.interviewer._id.toString() === userId;

    const isCandidate =
      (session.candidateEmail || "").toLowerCase().trim() === userEmail;

    if (!isInterviewer && !isCandidate) {
      return res.status(403).json({
        title: "Access Denied",
        message:
          "Only the interviewer or the invited candidate can access this room.",
      });
    }

    res.status(200).json({
      session: {
        roomId: session.roomId,
        interviewerName: session.interviewer.name,
        interviewerEmail: session.interviewer.email,
        candidateEmail: session.candidateEmail,
        status: session.status,
        scheduledAt: session.scheduledAt,
        questions: session.questions,
        role: isInterviewer ? "interviewer" : "candidate",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      title: "Server Error",
      message: "Something went wrong. Please try again later.",
    });
  }
});

// 5 Start Page Route
router.get("/start/:roomId", isLoggedIn, async (req, res) => {
  try {
    const { roomId } = req.params;

    const session = await Session.findOne({ roomId })
      .populate("interviewer", "name")
      .populate("questions");

    if (!session) {
      return res.status(404).json({
        title: "Invalid Room",
        message: "This interview room does not exist.",
      });
    }

    if (session.status === "completed") {
      return res.status(400).json({
        title: "Interview Ended",
        message: "This interview has already ended.",
      });
    }

    if (session.interviewer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        title: "Access Denied",
        message: "Only the interviewer can access this page.",
      });
    }

    res.status(200).json({
      session: {
        roomId: session.roomId,
        interviewerName: session.interviewer.name,
        status: session.status,
        scheduledAt: session.scheduledAt,
        questions: session.questions,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      title: "Server Error",
      message: "Something went wrong. Please try again later.",
    });
  }
});

// Cancel Interview
router.delete("/:roomId", isLoggedIn, async (req, res) => {
  try {
    const { roomId } = req.params;

    const session = await Session.findOne({ roomId }).populate(
      "interviewer",
      "name",
    );

    if (!session) {
      return res.status(404).json({
        title: "Invalid Room",
        message: "This interview session does not exist.",
      });
    }

    // Sirf interviewer hi cancel kar sakta hai
    if (session.interviewer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        title: "Access Denied",
        message: "Only the interviewer can cancel this session.",
      });
    }

    // Sirf upcoming session cancel ho sakta hai
    if (session.status !== "upcoming") {
      return res.status(400).json({
        title: "Cannot Cancel",
        message: "Only upcoming sessions can be cancelled.",
      });
    }

    // Soft delete — status update
    session.status = "cancelled";
    await session.save();

    // Candidate ko mail bhejo (fail ho toh route fail na ho)
    try {
      await sendInterviewCancelledEmail(
        session.candidateEmail,
        session.interviewer.name,
        session.scheduledAt,
      );
    } catch (mailErr) {
      console.error("Failed to send cancellation email:", mailErr);
    }

    res.status(200).json({
      message: "Session cancelled successfully",
      session: {
        _id: session._id,
        roomId: session.roomId,
        status: session.status,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      title: "Server Error",
      message: "Something went wrong. Please try again later.",
    });
  }
});

// Edit Interview Details
router.put("/:roomId/edit", isLoggedIn, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { questionIds, scheduledAt } = req.body;

    if (!questionIds || questionIds.length === 0) {
      return res.status(400).json({
        title: "Invalid Input",
        message: "At least one question is required.",
      });
    }

    const session = await Session.findOne({ roomId }).populate(
      "interviewer",
      "name email",
    );

    if (!session) {
      return res.status(404).json({
        title: "Invalid Room",
        message: "This interview session does not exist.",
      });
    }

    // Sirf interviewer
    if (session.interviewer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        title: "Access Denied",
        message: "Only the interviewer can edit this session.",
      });
    }

    // Sirf upcoming
    if (session.status !== "upcoming") {
      return res.status(400).json({
        title: "Cannot Edit",
        message: "Only upcoming sessions can be edited.",
      });
    }

    // past date validation (server-side)
    if (scheduledAt && new Date(scheduledAt) < new Date()) {
      return res.status(400).json({
        title: "Invalid Time",
        message: "Scheduled time cannot be in the past.",
      });
    }

    // Questions validate
    const questions = await Question.find({ _id: { $in: questionIds } });
    if (questions.length !== questionIds.length) {
      return res.status(400).json({
        title: "Invalid Questions",
        message: "Some questions are invalid.",
      });
    }

    const userEmail = (req.user.email || "").toLowerCase().trim();
    const userId = req.user._id.toString();

    const allAccessible = questions.every((q) => {
      const isOwner = q.createdBy.toString() === userId;
      const isShared = q.sharedWith.some((s) => s.email === userEmail);
      return isOwner || isShared;
    });

    if (!allAccessible) {
      return res.status(400).json({
        title: "Invalid Questions",
        message: "You do not have access to some of the selected questions.",
      });
    }

    // Time change detect
    const oldTime = session.scheduledAt
      ? new Date(session.scheduledAt).getTime()
      : null;
    const newTime = scheduledAt ? new Date(scheduledAt).getTime() : null;
    const timeChanged = oldTime !== newTime;

    // Update
    session.questions = questionIds;
    if (scheduledAt) {
      session.scheduledAt = scheduledAt;
    }
    await session.save();

    // Mail sirf tab jab time change hua
    if (timeChanged) {
      try {
        await sendInterviewRescheduleEmail(
          session.candidateEmail,
          session.interviewer.name,
          `${process.env.CLIENT_URL}/join/${roomId}`,
          session.scheduledAt,
        );
      } catch (mailErr) {
        console.error("Failed to send reschedule email:", mailErr);
      }
    }

    res.status(200).json({
      message: timeChanged
        ? "Session updated and candidate notified of new time"
        : "Session updated",
      session: {
        _id: session._id,
        roomId: session.roomId,
        candidateEmail: session.candidateEmail,
        scheduledAt: session.scheduledAt,
        questions: session.questions,
        status: session.status,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      title: "Server Error",
      message: "Something went wrong. Please try again later.",
    });
  }
});

// ---------- GET NOTES (interviewer only) ----------
router.get("/:roomId/notes", isLoggedIn, async (req, res) => {
  try {
    const { roomId } = req.params;

    const session = await Session.findOne({ roomId });
    if (!session) {
      return res.status(404).json({
        title: "Invalid Room",
        message: "This interview room does not exist.",
      });
    }

    if (session.status !== "live") {
      return res.status(400).json({
        title: "Interview Not Live",
        message: "Notes are only available during a live interview.",
      });
    }

    // Sirf interviewer hi notes dekh sakta hai
    if (session.interviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        title: "Access Denied",
        message: "Only the interviewer can view notes.",
      });
    }

    const note = await SessionNote.findOne({ sessionId: session._id });

    res.status(200).json({
      note: note
        ? { content: note.content, updatedAt: note.updatedAt }
        : { content: "", updatedAt: null },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      title: "Server Error",
      message: "Something went wrong. Please try again later.",
    });
  }
});

// ---------- PUT NOTES (upsert, interviewer only) ----------
router.put("/:roomId/notes", isLoggedIn, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;

    // Content validation
    if (typeof content !== "string") {
      return res.status(400).json({
        title: "Invalid Input",
        message: "Content must be a string.",
      });
    }
    if (content.length > 20000) {
      return res.status(400).json({
        title: "Too Long",
        message: "Notes cannot exceed 20,000 characters.",
      });
    }

    const session = await Session.findOne({ roomId });
    if (!session) {
      return res.status(404).json({
        title: "Invalid Room",
        message: "This interview room does not exist.",
      });
    }

    if (session.status !== "live") {
      return res.status(400).json({
        title: "Interview Not Live",
        message: "Notes can only be saved during a live interview.",
      });
    }

    if (session.interviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        title: "Access Denied",
        message: "Only the interviewer can save notes.",
      });
    }

    // Upsert — first time create, baad mein update
    const note = await SessionNote.findOneAndUpdate(
      { sessionId: session._id },
      {
        sessionId: session._id,
        roomId,
        content,
        updatedBy: req.user._id,
      },
      { upsert: true, new: true },
    );

    res.status(200).json({
      message: "Notes saved",
      note: { content: note.content, updatedAt: note.updatedAt },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      title: "Server Error",
      message: "Something went wrong. Please try again later.",
    });
  }
});

// generate interview report route
router.get("/:roomId/report", isLoggedIn, async (req, res) => {
  try {
    const { roomId } = req.params;

    // 1. Session check (with Interviewer)
    const session = await Session.findOne({ roomId })
      .populate("interviewer", "name email")
      .populate("questions");

    if (!session) return res.status(404).json({ message: "Session not found" });

    // 2. Auth Check (Sirf interviewer)
    if (session.interviewer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access Denied" });
    }

    // 3. Completed Check
    if (session.status !== "completed") {
      return res.status(400).json({ message: "Session is not completed yet" });
    }

    // 4. Fetch Notes
    const note = await SessionNote.findOne({ sessionId: session._id });

    // 5. Fetch Code Submissions (jo best save hue the)
    const submissions = await CodeSubmission.find({ sessionId: session._id });

    // 6. Combine Submissions with Questions
    const questionsWithSubmissions = session.questions.map((q) => {
      const sub = submissions.find(
        (s) => s.questionId.toString() === q._id.toString(),
      );
      return {
        _id: q._id,
        title: q.title,
        description: q.description,
        difficulty: q.difficulty,
        submission: sub || null,
      };
    });

    res.status(200).json({
      session: {
        interviewer: session.interviewer,
        candidateEmail: session.candidateEmail,
        scheduledAt: session.scheduledAt,
      },
      notes: note ? note.content : "No notes provided.",
      violations: session.violations || [],
      questions: questionsWithSubmissions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
