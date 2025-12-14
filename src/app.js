import express from "express";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Сервер работает");
});

app.use("/auth", authRoutes);
app.use("/chats", chatRoutes);

export default app;