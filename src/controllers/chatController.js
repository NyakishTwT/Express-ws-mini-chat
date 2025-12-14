import * as chatService from "../services/chatService.js";
import { broadcastToUser } from "../wsHub.js";

export async function patchMessage(req, res, next) {
  try {
    const chatId = Number(req.params.id);
    const messageId = Number(req.params.messageId);
    const { text } = req.body;

    if (!text) return res.status(400).json({ message: "text required" });

    const updated = await chatService.updateMessage(req.user.id, chatId, messageId, text);
    if (!updated) return res.status(404).json({ message: "Message not found" });

    broadcastToUser(req.user.id, { type: "message_updated", payload: updated });

    res.json(updated);
  } catch (e) {
    next(e);
  }
}

export async function removeMessage(req, res, next) {
  try {
    const chatId = Number(req.params.id);
    const messageId = Number(req.params.messageId);

    const deleted = await chatService.deleteMessage(req.user.id, chatId, messageId);
    if (!deleted) return res.status(404).json({ message: "Message not found" });

    broadcastToUser(req.user.id, { type: "message_deleted", payload: { chat_id: chatId, id: messageId } });

    res.json({ message: "ok" });
  } catch (e) {
    next(e);
  }
}
export async function postMessage(req, res, next) {
  try {
    const chatId = Number(req.params.id);
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "text required" });

    const msg = await chatService.createMessage(req.user.id, chatId, text);
    if (!msg) return res.status(404).json({ message: "Chat not found" });

    broadcastToUser(req.user.id, { type: "new_message", payload: msg });

    res.status(201).json(msg);
  } catch (e) {
    next(e);
  }
}

export async function getChats(req, res, next) {
  try {
    const chats = await chatService.listChats(req.user.id);
    res.json(chats);
  } catch (e) {
    next(e);
  }
}

export async function postChat(req, res, next) {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "name required" });

    const chat = await chatService.createChat(req.user.id, name);
    res.status(201).json(chat);
  } catch (e) {
    next(e);
  }
}

export async function patchChat(req, res, next) {
  try {
    const chatId = Number(req.params.id);
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "name required" });

    const changes = await chatService.renameChat(req.user.id, chatId, name);
    if (!changes) return res.status(404).json({ message: "Chat not found" });

    res.json({ message: "ok" });
  } catch (e) {
    next(e);
  }
}

export async function removeChat(req, res, next) {
  try {
    const chatId = Number(req.params.id);
    const changes = await chatService.deleteChat(req.user.id, chatId);
    if (!changes) return res.status(404).json({ message: "Chat not found" });

    res.json({ message: "ok" });
  } catch (e) {
    next(e);
  }
}

export async function getChatMessages(req, res, next) {
  try {
    const chatId = Number(req.params.id);
    const data = await chatService.listMessages(req.user.id, chatId);
    if (!data) return res.status(404).json({ message: "Chat not found" });

    res.json(data);
  } catch (e) {
    next(e);
  }
}

