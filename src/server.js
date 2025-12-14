import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";

import { initDb } from "../db/db.js";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { initWebSocket } from "./wsHub.js";

initDb();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/auth", authRoutes);
app.use("/api/chats", chatRoutes);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);

//ws
initWebSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));