import { WebSocketServer } from "ws";
import { verifyToken } from "./config/jwt.js";

const userSockets = new Map();

function addSocket(userId, ws) {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId).add(ws);
}

function removeSocket(userId, ws) {
  const set = userSockets.get(userId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) userSockets.delete(userId);
}

export function broadcastToUser(userId, payload) {
  const set = userSockets.get(userId);
  if (!set) return;

  const data = JSON.stringify(payload);
  for (const ws of set) {
    if (ws.readyState === ws.constructor.OPEN) {
      ws.send(data);
    }
  }
}

export function initWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws, req) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get("token");

      if (!token) {
        ws.close(1008, "No token");
        return;
      }

      const decoded = verifyToken(token);
      const userId = decoded.id;

      ws.userId = userId;
      addSocket(userId, ws);

      ws.on("close", () => removeSocket(userId, ws));
      ws.on("error", () => removeSocket(userId, ws));
    } catch (e) {
      ws.close(1008, "Invalid token");
    }
  });

  return wss;
}