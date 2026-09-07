import http from "http";
import ws from "ws";
const { WebSocketServer } = ws;
import { setupWSConnection } from "@y/websocket-server/utils";

const port = process.env.PORT || 1234;

const server = http.createServer();

const wss = new WebSocketServer({
  server,
});

wss.on("connection", (ws, request) => {
  setupWSConnection(ws, request);
});

server.listen(port, () => {
  console.log(`Yjs WebSocket server running on port ${port}`);
});
