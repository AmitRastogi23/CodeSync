import express from "express";
import Question from "../models/Questions.js";

import cloudinary, { uploadQuestion } from "../config/cloudinary.js";

import { sendQuestionsSharedEmail } from "../config/mailer.js";

const router = express.Router();

const isLoggedIn = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  next();
};

// 1. CREATE QUESTION
router.post(
  "/",
  isLoggedIn,
  uploadQuestion.single("image"),
  async (req, res) => {
    try {
      const { title, description, constraints, difficulty } = req.body;
      const testCases = JSON.parse(req.body.testCases || "[]");

      if (!title || !description || testCases.length === 0) {
        if (req.file) await cloudinary.uploader.destroy(req.file.filename);
        return res.status(400).json({
          message:
            "Title, description, and at least one test case are required",
        });
      }

      const newQuestion = await Question.create({
        title,
        description,
        constraints,
        difficulty,
        testCases,
        exampleImage: req.file ? req.file.path : "",
        exampleImagePublicId: req.file ? req.file.filename : "",
        createdBy: req.user._id,
      });

      res.status(201).json({
        message: "Question created successfully",
        question: newQuestion,
      });
    } catch (err) {
      console.error(err);
      if (req.file) await cloudinary.uploader.destroy(req.file.filename);
      res.status(500).json({ message: "Server error" });
    }
  },
);

// 2. GET MY QUESTIONS
router.get("/my", isLoggedIn, async (req, res) => {
  try {
    const questions = await Question.find({
      createdBy: req.user._id,
      isArchivedByOwner: false,
    }).sort({
      createdAt: 1,
    });
    res.status(200).json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/shared", isLoggedIn, async (req, res) => {
  try {
    const userEmail = (req.user.email || "").toLowerCase().trim();
    const questions = await Question.find({
      "sharedWith.email": userEmail,
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET ALL ACCESSIBLE QUESTIONS (Own + Shared for Session Dropdown)
router.get("/accessible", isLoggedIn, async (req, res) => {
  try {
    const userEmail = (req.user.email || "").toLowerCase().trim();

    const questions = await Question.find({
      $or: [
        { createdBy: req.user._id, isArchivedByOwner: false },
        { "sharedWith.email": userEmail },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 3. UPDATE / EDIT QUESTION
router.patch(
  "/:id",
  isLoggedIn,
  uploadQuestion.single("image"),
  async (req, res) => {
    try {
      const question = await Question.findById(req.params.id);

      // 1. Not Found: Upload hui image delete karo
      if (!question) {
        if (req.file) {
          cloudinary.uploader.destroy(req.file.filename).catch(() => {});
        }
        return res.status(404).json({ message: "Question not found" });
      }

      // 2. Unauthorized: Upload hui image delete karo
      if (question.createdBy.toString() !== req.user._id.toString()) {
        if (req.file) {
          cloudinary.uploader.destroy(req.file.filename).catch(() => {});
        }
        return res.status(403).json({ message: "You are not authorized" });
      }

      // 3. Data Validation Fail (Optional): Upload hui image delete karo
      // (Agar tu edit me koi validation laga raha hai, toh yahan check karke delete kar)

      // 4. Fields Update karo
      if (req.body.title) question.title = req.body.title;
      if (req.body.description) question.description = req.body.description;
      if (req.body.constraints !== undefined)
        question.constraints = req.body.constraints;
      if (req.body.difficulty) question.difficulty = req.body.difficulty;

      if (req.body.testCases) {
        try {
          question.testCases = JSON.parse(req.body.testCases);
        } catch (e) {
          if (req.file)
            cloudinary.uploader.destroy(req.file.filename).catch(() => {});
          return res.status(400).json({ message: "Invalid test cases format" });
        }
      }

      // 5. Nayi image aayi hai toh purani delete karo
      if (req.file) {
        if (question.exampleImagePublicId) {
          cloudinary.uploader
            .destroy(question.exampleImagePublicId)
            .catch(() => {});
        }
        question.exampleImage = req.file.path;
        question.exampleImagePublicId = req.file.filename;
      }

      await question.save();

      res.status(200).json({
        message: "Question updated successfully",
        question,
      });
    } catch (err) {
      console.error(err);
      if (req.file)
        cloudinary.uploader.destroy(req.file.filename).catch(() => {});
      res.status(500).json({ message: "Server error" });
    }
  },
);

// 4. SHARE QUESTIONS
router.post("/share", isLoggedIn, async (req, res) => {
  try {
    const { questionIds, email } = req.body;

    if (!email || !questionIds || questionIds.length === 0) {
      return res.status(400).json({
        message: "Email and at least one question are required.",
      });
    }

    // 0. Khud ko share karne se roko
    const targetEmail = email.toLowerCase().trim();
    const myEmail = (req.user.email || "").toLowerCase().trim();

    if (targetEmail === myEmail) {
      return res.status(400).json({
        message: "You cannot share questions with yourself.",
      });
    }

    // 1. Check karo ki saare questions usi user ke hain
    const questions = await Question.find({ _id: { $in: questionIds } });

    if (questions.length !== questionIds.length) {
      return res.status(400).json({ message: "Some questions are invalid." });
    }

    const allOwned = questions.every(
      (q) => q.createdBy.toString() === req.user._id.toString(),
    );

    if (!allOwned) {
      return res.status(403).json({
        message: "You can only share your own questions.",
      });
    }

    // 2. Sabhi questions ke sharedWith array me email add karo (agar pehle se nahi hai)
    await Question.updateMany(
      { _id: { $in: questionIds } },
      {
        $addToSet: {
          sharedWith: {
            email: targetEmail,
            sharedAt: new Date(),
          },
        },
      },
    );

    // 3. Mail bhejo
    try {
      await sendQuestionsSharedEmail(
        targetEmail,
        req.user.name || "A user",
        questions.length,
      );
    } catch (mailErr) {
      console.error("Failed to send share email:", mailErr);
    }

    res.status(200).json({
      message: "Questions shared successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 5. DELETE QUESTION
router.delete("/:id", isLoggedIn, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    if (question.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized" });
    }

    // Hard delete ki jagah Archive
    question.isArchivedByOwner = true;
    await question.save();

    res.status(200).json({ message: "Question archived successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
