import { all, get, run } from "../../db/db.js";

//chats

export async function listChats(userId) {
  return all(
    "SELECT id, name, user_id FROM chats WHERE user_id = ? ORDER BY id DESC",
    [userId]
  );
}

export async function createChat(userId, name) {
  const result = await run(
    "INSERT INTO chats (name, user_id) VALUES (?, ?)",
    [name, userId]
    );
  
    return get("SELECT id, name, user_id FROM chats WHERE id = ?", [result.lastID]);
  }
  
  export async function renameChat(userId, chatId, name) {
    const result = await run(
      "UPDATE chats SET name = ? WHERE id = ? AND user_id = ?",
      [name, chatId, userId]
    );
    return result.changes;
  }
  
  export async function deleteChat(userId, chatId) {
    const result = await run(
      "DELETE FROM chats WHERE id = ? AND user_id = ?",
      [chatId, userId]
    );
    return result.changes;
  }
  
  //messages
  
  export async function listMessages(userId, chatId) {
    const chat = await get("SELECT id FROM chats WHERE id = ? AND user_id = ?", [chatId, userId]);
    if (!chat) return null;
  
    return all(
      `
      SELECT m.id, m.text, m.chat_id, m.user_id, m.created_at
      FROM messages m
      WHERE m.chat_id = ?
      ORDER BY m.created_at ASC, m.id ASC
      `,
      [chatId]
    );
  }
  
  export async function createMessage(userId, chatId, text) {
    const chat = await get("SELECT id FROM chats WHERE id = ? AND user_id = ?", [chatId, userId]);
    if (!chat) return null;
  
    const result = await run(
      "INSERT INTO messages (text, chat_id, user_id, created_at) VALUES (?, ?, ?, datetime('now'))",
      [text, chatId, userId]
    );
  
    return get(
      "SELECT id, text, chat_id, user_id, created_at FROM messages WHERE id = ?",
      [result.lastID]
    );
  }
  
  export async function updateMessage(userId, chatId, messageId, text) {
    const result = await run(
      `
      UPDATE messages
      SET text = ?
      WHERE id = ?
        AND chat_id = ?
        AND chat_id IN (SELECT id FROM chats WHERE id = ? AND user_id = ?)
      `,
      [text, messageId, chatId, chatId, userId]
    );
  
    if (!result.changes) return null;
  
    return get(
      "SELECT id, text, chat_id, user_id, created_at FROM messages WHERE id = ?",
      [messageId]
    );
  }
  
  export async function deleteMessage(userId, chatId, messageId) {
    const result = await run(
      `
      DELETE FROM messages
      WHERE id = ?
        AND chat_id = ?
        AND chat_id IN (SELECT id FROM chats WHERE id = ? AND user_id = ?)
      `,
      [messageId, chatId, chatId, userId]
    );
  
    return result.changes ? true : null;
  }