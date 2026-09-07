import express from "express";
import http from "http";
import { Server } from "socket.io";
import axios from "axios";
import path from "path";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("Client Connected", socket.id);
  let currentRoom = null;
  let currentUser = null;
  let lastExecutionTime = 0;

  // Join method to join a user in a room
  socket.on("join", ({ roomId, userName }) => {
    if (currentRoom) {
      const oldRoom = rooms.get(currentRoom);

      if (oldRoom) {
        oldRoom.users.delete(currentUser);
        io.to(currentRoom).emit("userJoined", Array.from(oldRoom.users));
      }

      socket.leave(currentRoom);
    }

    currentRoom = roomId;
    currentUser = userName;

    socket.join(roomId);

    console.log("👤 USER JOINED SOCKET ROOM");
    console.log("Room:", roomId);
    console.log("Socket:", socket.id);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        users: new Set(),
        messages: [],
      });
    }
    const room = rooms.get(roomId);
    room.users.add(userName);
    io.to(roomId).emit("userJoined", Array.from(room.users));

    if (room.users.size === 2) {
      const sockets = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
      if (sockets.length === 2) {
        io.to(sockets[0]).emit("startCall");
      }
    }

    socket.emit("chatHistory", room.messages);
  });

  socket.on("codeChange", ({ roomId, code }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    room.code = code;
    socket.to(roomId).emit("codeUpdate", code);
  });

  socket.on("leaveRoom", () => {
    if (currentRoom && currentUser) {
      const room = rooms.get(currentRoom);

      if (room) {
        room.users.delete(currentUser);
        io.to(currentRoom).emit("userJoined", Array.from(room.users));
        if (room.users.size === 0) {
          rooms.delete(currentRoom);
        }
      }

      socket.leave(currentRoom);
      currentRoom = null;
      currentUser = null;
    }
  });

  socket.on("typing", ({ roomId, userName }) => {
    socket.to(roomId).emit("userTyping", userName);
  });

  socket.on("compileCode", async ({ code, roomId, language, input }) => {
    const now = Date.now();

    if (now - lastExecutionTime < 3000) {
      socket.emit("codeResponse", {
        output: "Too many requests. Please wait 3 seconds.",
      });
      return;
    }

    lastExecutionTime = now;

    if (!code || typeof code !== "string") {
      socket.emit("codeResponse", {
        output: "Invalid code",
      });
      return;
    }

    if (!roomId || typeof roomId !== "string") {
      socket.emit("codeResponse", {
        output: "Invalid room",
      });
      return;
    }

    if (code.length > 50000) {
      socket.emit("codeResponse", {
        output: "Code size limit exceeded (max 50KB)",
      });
      return;
    }

    if (input && input.length > 10000) {
      socket.emit("codeResponse", {
        output: "Input size limit exceeded (max 10KB)",
      });
      return;
    }

    if (!rooms.has(roomId)) {
      io.to(roomId).emit("codeResponse", {
        output: "Room not found",
      });
      return;
    }

    try {
      const compilerMap = {
        java: "openjdk-jdk-22+36",
        cpp: "gcc-13.2.0",
        javascript: "nodejs-20.17.0",
        python: "cpython-3.14.0",
        c: "gcc-13.2.0-c",
        php: "php-8.3.12",
      };

      const compiler = compilerMap[language];

      if (!compiler) {
        io.to(roomId).emit("codeResponse", {
          output: `Language ${language} is not supported yet`,
        });
        return;
      }

      const response = await axios.post(
        "https://wandbox.org/api/compile.json",
        {
          compiler,
          code,
          stdin: input || "",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 5000,
        },
      );

      const result = response.data;

      let output = "";

      if (result.status === 0) {
        output = result.program_output || "No output";
      } else {
        output =
          result.compiler_error ||
          result.program_error ||
          result.compiler_message ||
          result.program_message ||
          "Execution failed";
      }

      socket.emit("codeResponse", {
        output,
      });
    } catch (error) {
      if (error.code === "ECONNABORTED") {
        socket.emit("codeResponse", {
          output: "Time Limit Exceeded",
        });
        return;
      }
      socket.emit("codeResponse", {
        output: `Error: ${error.response?.data || error.message}`,
      });
    }
  });

  socket.on("disconnect", () => {
    if (currentRoom && currentUser) {
      const room = rooms.get(currentRoom);

      if (room) {
        room.users.delete(currentUser);
        io.to(currentRoom).emit("userJoined", Array.from(room.users));
        if (room.users.size === 0) {
          rooms.delete(currentRoom);
        }
      }
    }
  });

  socket.on("sendMessage", ({ roomId, userName, message }) => {
    const room = rooms.get(roomId);
    if (!room || !message?.trim()) return;
    const chatMessage = {
      userName,
      message: message.trim(),
      timestamp: Date.now(),
    };
    room.messages.push(chatMessage);
    if (room.messages.length > 100) {
      room.messages.shift();
    }
    io.to(roomId).emit("receiveMessage", chatMessage);
  });

  socket.on("callOffer", ({ roomId, offer }) => {
    console.log("📤 BACKEND RECEIVED CALL OFFER");

    socket.to(roomId).emit("webrtcOffer", {
      offer,
      from: socket.id,
    });

    console.log("✅ WEBRTC OFFER FORWARDED");
  });

  socket.on("callAnswer", ({ roomId, answer }) => {
    socket.to(roomId).emit("callAnswer", {
      answer,
      from: socket.id,
    });
  });

  socket.on("iceCandidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("iceCandidate", {
      candidate,
    });
  });

  socket.on("mediaState", ({ roomId, audioEnabled, videoEnabled }) => {
    socket.to(roomId).emit("mediaState", {
      audioEnabled,
      videoEnabled,
    });
  });

  socket.on("testCall", ({ roomId }) => {
    console.log("🧪 TEST CALL FROM:", socket.id);
    socket.to(roomId).emit("testCallReceived");
    console.log("🧪 TEST CALL FORWARDED");
  });
});

const port = process.env.PORT || 5000;
const __dirname = path.resolve("..");

app.use(express.static(path.join(__dirname, "Frontend", "dist")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Frontend", "dist", "index.html"));
});

server.listen(port, () => {
  console.log(`server is working on port ${port}`);
});
