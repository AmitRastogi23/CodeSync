import http from "http";
import { Server } from "socket.io";
import "dotenv/config";

import app, { sessionMiddleware } from "./app.js";
import passport from "passport";
import connectDB from "./config/db.js";
import { setupSockets } from "./sockets/socketHandler.js";

// 1. Database connect karo
connectDB();

// 2. Express App se HTTP Server banao
const server = http.createServer(app);

// 3. Socket.io setup karo
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});
io.engine.use(sessionMiddleware);
io.engine.use(passport.initialize());
io.engine.use(passport.session());
// 4. Socket logic ko initialize karo
setupSockets(io);

// 5. Server ko listen karwao
const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server is working on port ${port}`);
});
