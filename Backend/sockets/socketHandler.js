import Session from "../models/Session.js";
import Question from "../models/Questions.js";
import CodeSubmission from "../models/CodeSubmission.js";
import mongoose from "mongoose";
import axios from "axios";

export const setupSockets = (io) => {
  const rooms = new Map();
  const waitingRooms = new Map();

  io.use((socket, next) => {
    socket.user = socket.request.user || null;
    return next();
  });

  const emitParticipantsUpdate = (roomId) => {
    const room = rooms.get(roomId);
    const waiting = waitingRooms.get(roomId) || new Map();

    const inRoom = room
      ? Array.from(room.users.entries()).map(([email, info]) => ({
          email,
          name: info.name,
          role: info.role,
        }))
      : [];

    const waitingArr = Array.from(waiting.entries()).map(([email, info]) => ({
      email,
      name: info.name,
    }));

    io.to(roomId).emit("participantsUpdate", {
      waiting: waitingArr,
      inRoom: inRoom,
    });
  };

  const moveCandidateToWaiting = (roomId, room) => {
    const candidateEntry = Array.from(room.users.entries())[0];
    if (!candidateEntry) return;

    const [candidateEmail, candidateInfo] = candidateEntry;

    // Candidate ke socket ko dhoondo aur returnToWaiting bhejo
    const roomSockets = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    let candidateSocketId = null;

    for (const sid of roomSockets) {
      const s = io.sockets.sockets.get(sid);
      if (s && (s.user?.email || "").toLowerCase().trim() === candidateEmail) {
        candidateSocketId = s.id;
        s.emit("returnToWaiting", {
          title: "Interviewer Left",
          message:
            "The interviewer has left the session. Please wait to be admitted again.",
        });
        s.leave(roomId);
        break;
      }
    }

    // Candidate ko waitingRooms mein add karo (taaki dobara admit ho sake)
    if (!waitingRooms.has(roomId)) {
      waitingRooms.set(roomId, new Map());
    }
    waitingRooms.get(roomId).set(candidateEmail, {
      name: candidateInfo.name,
      socketId: candidateSocketId,
    });

    // Room se candidate remove karo
    room.users.delete(candidateEmail);
  };

  const handleUserLeave = async (
    socket,
    currentRoom,
    currentUser,
    isIntentionalLeave = false,
  ) => {
    if (!currentRoom || !currentUser) return;

    const room = rooms.get(currentRoom);
    if (!room) return;

    const leavingUserInfo = room.users.get(currentUser);
    const leavingRole = leavingUserInfo?.role;

    if (leavingRole === "candidate") {
      const interviewerEntry = Array.from(room.users.entries()).find(
        ([_, info]) => info.role === "interviewer",
      );
      if (interviewerEntry) {
        const interviewerEmail = interviewerEntry[0];
        const roomSockets = Array.from(
          io.sockets.adapter.rooms.get(currentRoom) || [],
        );
        for (const sid of roomSockets) {
          const s = io.sockets.sockets.get(sid);
          if (
            s &&
            (s.user?.email || "").toLowerCase().trim() === interviewerEmail
          ) {
            s.emit("violationAlert", {
              message: "Candidate left the room",
              type: "candidate_left",
              timestamp: Date.now(),
              candidateName: leavingUserInfo.name || "Candidate",
            });
            break;
          }
        }
      }
    }

    room.users.delete(currentUser);
    socket.to(currentRoom).emit("peerLeft");

    if (leavingRole === "interviewer") {
      if (isIntentionalLeave) {
        try {
          await Session.findOneAndUpdate(
            { roomId: currentRoom },
            { status: "completed" },
          );
        } catch (err) {
          console.error("Failed to mark session completed:", err);
        }
      }
      moveCandidateToWaiting(currentRoom, room);
    }

    io.to(currentRoom).emit(
      "userJoined",
      Array.from(room.users.entries()).map(([email, info]) => ({
        email,
        ...info,
      })),
    );

    emitParticipantsUpdate(currentRoom);
    socket.leave(currentRoom);
  };

  io.on("connection", (socket) => {
    let currentRoom = null;
    let currentUser = null;
    let lastExecutionTime = 0;
    let lastSubmitTime = 0;

    let waitingRoomId = null;
    let waitingUserEmail = null;

    // Join method to join a user in a room
    socket.on("join", async ({ roomId }) => {
      try {
        // 0. Socket auth se user nikalo (middleware ne set kiya)
        const user = socket.user;
        if (!user || !user.email) {
          socket.emit("joinError", {
            title: "Unauthorized Access",
            message: "You must be logged in to join this room.",
          });
          return;
        }

        const userId = user._id.toString();
        const userEmail = (user.email || "").toLowerCase().trim();
        const userName = user.name || "User";

        // 1. DB se Session check karo
        const session = await Session.findOne({ roomId }).populate(
          "interviewer",
          "email",
        );

        if (!session) {
          socket.emit("joinError", {
            title: "Invalid Room",
            message: "This interview room does not exist.",
          });
          return;
        }

        if (session.status === "completed") {
          socket.emit("joinError", {
            title: "Interview Ended",
            message: "This interview has already ended.",
          });
          return;
        }

        // 2. Check karo ki user kaun hai (Interviewer ya Candidate)
        const isInterviewer = session.interviewer._id.toString() === userId;
        const isCandidate =
          (session.candidateEmail || "").toLowerCase().trim() === userEmail;

        if (!isInterviewer && !isCandidate) {
          socket.emit("joinError", {
            title: "Access Denied",
            message:
              "Only the interviewer or the invited candidate can access this room.",
          });
          return;
        }

        // NAYA: Candidate ko admit ke bina andar aane se roko
        if (isCandidate) {
          const waiting = waitingRooms.get(roomId);
          const wasAdmitted = waiting && !waiting.has(userEmail);
          if (!wasAdmitted) {
            socket.emit("joinError", {
              title: "Not Admitted",
              message:
                "Please wait for the interviewer to admit you before entering the room.",
            });
            return;
          }
        }

        // 3. Room capacity check (Sirf 2 log allowed)
        if (!rooms.has(roomId)) {
          rooms.set(roomId, {
            users: new Map(),
            messages: [],
          });
        }

        const room = rooms.get(roomId);

        // Agar already 2 log hain aur ye naya banda hai, toh rok do
        if (room.users.size >= 2 && !room.users.has(userEmail)) {
          socket.emit("joinError", {
            title: "Room Full",
            message: "This room already has two participants.",
          });
          return;
        }

        // 4. Join karwao
        if (currentRoom && currentRoom !== roomId) {
          const oldRoom = rooms.get(currentRoom);
          if (oldRoom) {
            oldRoom.users.delete(currentUser);
            io.to(currentRoom).emit("userJoined", Array.from(oldRoom.users));
          }
          socket.leave(currentRoom);
        }

        currentRoom = roomId;
        currentUser = userEmail;

        socket.join(roomId);
        room.users.set(userEmail, {
          name: userName,
          role: isInterviewer ? "interviewer" : "candidate",
        });

        io.to(roomId).emit(
          "userJoined",
          Array.from(room.users.entries()).map(([email, info]) => ({
            email,
            ...info,
          })),
        );

        // mark session status as live
        if (isInterviewer && session.status !== "live") {
          try {
            await Session.findOneAndUpdate({ roomId }, { status: "live" });
          } catch (err) {
            console.error("Failed to mark session live:", err);
          }
        }

        emitParticipantsUpdate(roomId);

        socket.emit("joinSuccess");
        socket.emit("chatHistory", room.messages);
      } catch (err) {
        socket.emit("joinError", {
          title: "Server Error",
          message: "Something went wrong while joining the room.",
        });
      }
    });

    socket.on("candidateWaiting", async ({ roomId }) => {
      try {
        const user = socket.user;
        if (!user || !user.email) {
          socket.emit("waitingError", {
            title: "Unauthorized Access",
            message: "You must be logged in.",
          });
          return;
        }

        const userEmail = (user.email || "").toLowerCase().trim();
        const userName = user.name || "User";

        const session = await Session.findOne({ roomId }).populate(
          "interviewer",
          "email",
        );

        if (!session) {
          socket.emit("waitingError", {
            title: "Invalid Room",
            message: "This interview room does not exist.",
          });
          return;
        }

        if (session.status === "completed") {
          socket.emit("waitingError", {
            title: "Interview Ended",
            message: "This interview has already ended.",
          });
          return;
        }

        // Sirf candidate hi waiting mein aa sakta hai
        const candidateEmail = (session.candidateEmail || "")
          .toLowerCase()
          .trim();
        if (candidateEmail !== userEmail) {
          socket.emit("waitingError", {
            title: "Access Denied",
            message: "Only the invited candidate can enter the waiting room.",
          });
          return;
        }

        // waiting map initialize karo
        if (!waitingRooms.has(roomId)) {
          waitingRooms.set(roomId, new Map());
        }

        const waiting = waitingRooms.get(roomId);

        // Candidate ko waiting mein add karo (email -> { name, socketId })
        waiting.set(userEmail, { name: userName, socketId: socket.id });

        // Track karo ki ye socket kis waiting room mein hai
        waitingRoomId = roomId;
        waitingUserEmail = userEmail;

        // Participants update bhejo interviewer ko (aur room ke sab ko)
        emitParticipantsUpdate(roomId);
      } catch (err) {
        socket.emit("waitingError", {
          title: "Server Error",
          message: "Something went wrong. Please try again.",
        });
      }
    });

    socket.on("admitCandidate", async ({ roomId, candidateEmail }) => {
      try {
        const user = socket.user;
        if (!user || !user.email) {
          socket.emit("admitError", {
            title: "Unauthorized Access",
            message: "You must be logged in.",
          });
          return;
        }

        const session = await Session.findOne({ roomId }).populate(
          "interviewer",
          "email",
        );

        if (!session) {
          socket.emit("admitError", {
            title: "Invalid Room",
            message: "This interview room does not exist.",
          });
          return;
        }

        const userId = user._id.toString();
        if (session.interviewer._id.toString() !== userId) {
          socket.emit("admitError", {
            title: "Access Denied",
            message: "Only the interviewer can admit candidates.",
          });
          return;
        }

        // Normalize email
        const normCandidateEmail = (candidateEmail || "").toLowerCase().trim();

        const waiting = waitingRooms.get(roomId);
        if (!waiting || !waiting.has(normCandidateEmail)) {
          socket.emit("admitError", {
            title: "Not Found",
            message: "This candidate is not waiting in the room.",
          });
          return;
        }

        const candidateInfo = waiting.get(normCandidateEmail);
        const candidateSocketId = candidateInfo.socketId;

        // Waiting se remove karo (ab ye room mein aa sakta hai)
        waiting.delete(normCandidateEmail);

        // Candidate ko "admitted" event bhejo
        if (candidateSocketId) {
          io.to(candidateSocketId).emit("admitted");
        }

        // Participants update bhejo
        emitParticipantsUpdate(roomId);
      } catch (err) {
        socket.emit("admitError", {
          title: "Server Error",
          message: "Something went wrong. Please try again.",
        });
      }
    });

    socket.on("requestParticipants", ({ roomId }) => {
      emitParticipantsUpdate(roomId);
    });

    socket.on("leaveRoom", async () => {
      await handleUserLeave(socket, currentRoom, currentUser, true);
      currentRoom = null;
      currentUser = null;
    });

    socket.on("typing", ({ roomId, userName }) => {
      socket.to(roomId).emit("userTyping", userName);
    });

    socket.on(
      "runTestCases",
      async ({ code, roomId, language, questionId }) => {
        try {
          const question = await Question.findById(questionId);
          if (!question) {
            socket.emit("testCasesResult", { error: "Question not found" });
            return;
          }

          const sampleTestCases = question.testCases.filter(
            (tc) => !tc.isHidden,
          );

          if (sampleTestCases.length === 0) {
            socket.emit("testCasesResult", {
              error: "No sample test cases available",
            });
            return;
          }

          // 2. Language ID nikal
          const languageMap = {
            c: 50,
            cpp: 54,
            java: 62,
            javascript: 63,
            php: 68,
            python: 71,
          };
          const languageId = languageMap[language];
          if (!languageId) {
            socket.emit("testCasesResult", {
              error: `Language ${language} not supported`,
            });
            return;
          }

          // 3. Ek-ek karke test cases run karo
          const results = [];
          for (let i = 0; i < sampleTestCases.length; i++) {
            const tc = sampleTestCases[i];
            try {
              const response = await axios.post(
                process.env.COMPILER_URL,
                {
                  source_code: code,
                  language_id: languageId,
                  stdin: tc.input,
                },
                { timeout: 15000 },
              );

              const result = response.data;
              let actualOutput = "";

              if (result.stdout) actualOutput += result.stdout;
              if (result.stderr) actualOutput += result.stderr;
              if (result.compile_output) actualOutput += result.compile_output;
              if (!actualOutput)
                actualOutput = result.status?.description || "No output";

              // 4. Compare karo
              const cleanActual = actualOutput.trim();
              const cleanExpected = tc.expectedOutput.trim();
              const passed = cleanActual === cleanExpected;

              results.push({
                testCase: i + 1,
                input: tc.input,
                expected: cleanExpected,
                output: cleanActual,
                passed,
              });
            } catch (err) {
              results.push({
                testCase: i + 1,
                input: tc.input,
                expected: tc.expectedOutput,
                output: "Error executing test case",
                passed: false,
              });
            }
          }

          // 5. Result frontend ko bhejo
          io.to(roomId).emit("testCasesResult", { results });
        } catch (error) {
          io.to(roomId).emit("testCasesResult", {
            error: "Server error while running test cases",
          });
        }
      },
    );

    socket.on(
      "submitTestCases",
      async ({ code, roomId, language, questionId }) => {
        try {
          // 1. Socket user check
          if (!socket.user || !socket.user.email) {
            socket.emit("submitResult", {
              error: "Unauthorized! Please Login.",
            });
            return;
          }

          const now = Date.now();
          if (now - lastSubmitTime < 3000) {
            socket.emit("submitResult", {
              error: "Too many requests. Please wait 3 seconds.",
            });
            return;
          }
          lastSubmitTime = now;

          // 3. Input validation
          if (!code || typeof code !== "string" || code.trim().length === 0) {
            socket.emit("submitResult", { error: "Code cannot be empty" });
            return;
          }
          if (code.length > 50000) {
            socket.emit("submitResult", {
              error: "Code size limit exceeded (max 50KB)",
            });
            return;
          }
          if (!roomId || typeof roomId !== "string") {
            socket.emit("submitResult", { error: "Invalid room" });
            return;
          }
          if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
            socket.emit("submitResult", { error: "Invalid question" });
            return;
          }

          // 4. Session fetch + verify
          const session = await Session.findOne({ roomId }).populate(
            "interviewer",
            "email",
          );
          if (!session) {
            socket.emit("submitResult", { error: "Session not found" });
            return;
          }

          // 5. Session live hona chahiye
          if (session.status !== "live") {
            socket.emit("submitResult", {
              error: "Cannot submit. Interview is not live.",
            });
            return;
          }

          // 6. User interviewer ya candidate hona chahiye
          const userId = socket.user._id.toString();
          const userEmail = (socket.user.email || "").toLowerCase().trim();
          const isInterviewer = session.interviewer._id.toString() === userId;
          const isCandidate =
            (session.candidateEmail || "").toLowerCase().trim() === userEmail;

          if (!isInterviewer && !isCandidate) {
            socket.emit("submitResult", {
              error:
                "Only the interviewer or the invited candidate can submit.",
            });
            return;
          }

          // 7. Question session ka part hona chahiye
          const isQuestionInSession = session.questions.some(
            (qId) => qId.toString() === questionId.toString(),
          );
          if (!isQuestionInSession) {
            socket.emit("submitResult", {
              error: "This question is not part of this session.",
            });
            return;
          }

          // 8. Question fetch + hidden test cases
          const question = await Question.findById(questionId);
          if (!question) {
            socket.emit("submitResult", { error: "Question not found" });
            return;
          }
          const hiddenTestCases = question.testCases.filter(
            (tc) => tc.isHidden,
          );
          if (hiddenTestCases.length === 0) {
            socket.emit("submitResult", {
              error: "No hidden test cases available",
            });
            return;
          }

          // 9. Language check
          const languageMap = {
            c: 50,
            cpp: 54,
            java: 62,
            javascript: 63,
            php: 68,
            python: 71,
          };
          const languageId = languageMap[language];
          if (!languageId) {
            socket.emit("submitResult", {
              error: `Language ${language} not supported`,
            });
            return;
          }

          // 10. Test cases run karo
          const results = [];
          for (let i = 0; i < hiddenTestCases.length; i++) {
            const tc = hiddenTestCases[i];
            try {
              let cleanInput = tc.input;
              const match = cleanInput.match(/^\s*\w+\s*=\s*(.*)$/);
              if (match) cleanInput = match[1];
              cleanInput = cleanInput.replace(/^["']|["']$/g, "").trim();

              const response = await axios.post(
                "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
                {
                  source_code: code,
                  language_id: languageId,
                  stdin: cleanInput,
                },
                { timeout: 15000 },
              );

              const result = response.data;
              let actualOutput = "";
              if (result.stdout) actualOutput += result.stdout;
              if (result.stderr) actualOutput += result.stderr;
              if (result.compile_output) actualOutput += result.compile_output;
              if (!actualOutput)
                actualOutput = result.status?.description || "No output";

              const passed = actualOutput.trim() === tc.expectedOutput.trim();

              results.push({ testCase: i + 1, passed });
            } catch (err) {
              results.push({ testCase: i + 1, passed: false });
            }
          }

          // 11. Best submission logic (Approach B)
          const passedCount = results.filter((r) => r.passed).length;
          const totalCount = results.length;

          try {
            const existing = await CodeSubmission.findOne({
              sessionId: session._id,
              questionId,
            });

            // Agar existing already all-pass hai, toh naya submission ignore karo
            const existingIsPerfect =
              existing &&
              existing.totalCount > 0 &&
              existing.passedCount === existing.totalCount;

            if (!existingIsPerfect) {
              const shouldUpdate =
                !existing ||
                passedCount > existing.passedCount ||
                (passedCount === existing.passedCount && passedCount > 0); // same pass count → latest lo (agar pass > 0)

              if (shouldUpdate) {
                await CodeSubmission.findOneAndUpdate(
                  { sessionId: session._id, questionId },
                  {
                    sessionId: session._id,
                    roomId,
                    questionId,
                    submittedBy: socket.user._id,
                    code,
                    language,
                    passedCount,
                    totalCount,
                    submittedAt: Date.now(),
                  },
                  { upsert: true, new: true },
                );
              }
            }
          } catch (dbErr) {
            // DB save fail ho jaye toh result phir bhi bhejo
            console.error("Failed to save best submission:", dbErr);
          }

          // 12. Result frontend ko bhejo
          io.to(roomId).emit("submitResult", { results });
        } catch (error) {
          io.to(roomId).emit("submitResult", {
            error: "Server error while submitting",
          });
        }
      },
    );

    socket.on("disconnect", async () => {
      // Agar ye socket waiting mein tha (candidate), toh waiting se remove karo
      if (waitingRoomId && waitingUserEmail) {
        const waiting = waitingRooms.get(waitingRoomId);
        if (waiting && waiting.has(waitingUserEmail)) {
          waiting.delete(waitingUserEmail);
          emitParticipantsUpdate(waitingRoomId);
          if (waiting.size === 0) waitingRooms.delete(waitingRoomId);
        }
      }

      // Common leave logic (interviewer ho toh candidate ko waiting bhejega)
      await handleUserLeave(socket, currentRoom, currentUser, false);
    });

    socket.on("sendMessage", ({ roomId, message }) => {
      const room = rooms.get(roomId);
      if (!room || !message?.trim()) return;

      if (!socket.rooms.has(roomId)) {
        return;
      }

      const chatMessage = {
        userName: socket.user?.name || "User",
        message: message.trim(),
        timestamp: Date.now(),
      };
      room.messages.push(chatMessage);
      if (room.messages.length > 100) {
        room.messages.shift();
      }
      io.to(roomId).emit("receiveMessage", chatMessage);
    });

    // Candidate violation detect hone pe interviewer ko alert bhejo
    socket.on("candidateViolation", async ({ roomId, type }) => {
      try {
        const user = socket.user;
        if (!user || !user.email) return;

        const session = await Session.findOne({ roomId }).populate(
          "interviewer",
          "email",
        );
        if (!session) return;

        const userEmail = (user.email || "").toLowerCase().trim();
        const candidateEmail = (session.candidateEmail || "")
          .toLowerCase()
          .trim();

        if (candidateEmail !== userEmail) return;

        session.violations.push({ type, timestamp: new Date() });
        await session.save();

        // Interviewer ke socket ko dhoondo
        const interviewerEmail = (session.interviewer.email || "")
          .toLowerCase()
          .trim();
        const roomSockets = Array.from(
          io.sockets.adapter.rooms.get(roomId) || [],
        );

        let violationMessage = "Candidate attempted a prohibited action";
        if (type === "fullscreen_exit") {
          violationMessage = "Candidate exited fullscreen mode";
        } else if (type === "tab_switch") {
          violationMessage = "Candidate switched tabs";
        } else if (type === "window_blur") {
          violationMessage = "Candidate left the window";
        }

        for (const sid of roomSockets) {
          const s = io.sockets.sockets.get(sid);
          if (
            s &&
            (s.user?.email || "").toLowerCase().trim() === interviewerEmail
          ) {
            s.emit("violationAlert", {
              message: violationMessage,
              type,
              timestamp: Date.now(),
              candidateName: user.name || "Candidate",
            });
            break;
          }
        }
      } catch (err) {
        console.error("candidateViolation error:", err);
      }
    });

    // WebRTC handlers (most important and fragile)
    const inRoom = (roomId) =>
      typeof roomId === "string" && socket.rooms.has(roomId);

    socket.on("videoReady", ({ roomId }) => {
      if (inRoom(roomId)) socket.to(roomId).emit("peerReady");
    });

    socket.on("videoStopped", ({ roomId }) => {
      if (inRoom(roomId)) socket.to(roomId).emit("peerLeft");
    });

    socket.on("callOffer", ({ roomId, offer }) => {
      if (inRoom(roomId))
        socket.to(roomId).emit("webrtcOffer", { offer, from: socket.id });
    });

    socket.on("callAnswer", ({ roomId, answer }) => {
      if (inRoom(roomId))
        socket.to(roomId).emit("callAnswer", { answer, from: socket.id });
    });

    socket.on("iceCandidate", ({ roomId, candidate }) => {
      if (inRoom(roomId)) socket.to(roomId).emit("iceCandidate", { candidate });
    });

    socket.on("mediaState", ({ roomId, audioEnabled, videoEnabled }) => {
      if (inRoom(roomId))
        socket.to(roomId).emit("mediaState", { audioEnabled, videoEnabled });
    });

    socket.on("testCall", ({ roomId }) => {
      socket.to(roomId).emit("testCallReceived");
    });
  });
};
