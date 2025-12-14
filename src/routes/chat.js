import { Router } from "express";
import { protect } from "../middleware/protect.js";
import {
  getChats,
  postChat,
  patchChat,
  removeChat,
  getChatMessages,
  postMessage,
  patchMessage,
  removeMessage,
} from "../controllers/chatController.js";

const router = Router();

router.use(protect);

router.get("/", getChats);
router.post("/", postChat);
router.put("/:id", patchChat);
router.delete("/:id", removeChat);

router.get("/:id/messages", getChatMessages);
router.post("/:id/messages", postMessage);

router.put("/:id/messages/:messageId", patchMessage);
router.delete("/:id/messages/:messageId", removeMessage);

export default router;