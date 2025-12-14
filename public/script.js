let token = localStorage.getItem("token") || "";
let activeChatId = null;
let ws = null;

const authStatus = document.getElementById("authStatus");
const chatList = document.getElementById("chatList");
const messagesDiv = document.getElementById("messages");
const activeChat = document.getElementById("activeChat");

function setStatus(text) {
  authStatus.textContent = text;
}

function authHeaders() {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...authHeaders(),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request error");
  return data;
}

function connectWS() {
  if (!token) return;
  if (ws) ws.close();

  const url = `${location.origin.replace("http", "ws")}/?token=${encodeURIComponent(token)}`;
  ws = new WebSocket(url);

  ws.onopen = () => console.log("WS connected");

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);

      if (msg.type === "new_message") {
        if (activeChatId && Number(msg.payload.chat_id) === Number(activeChatId)) {
          renderMessage(msg.payload);
        }
      }
    } catch {
      console.warn("Bad WS message:", ev.data);
    }
  };

  ws.onclose = () => console.log("WS closed");
}

function renderChats(chats) {
  chatList.innerHTML = "";

  for (const c of chats) {
    const li = document.createElement("li");
    li.className = "chat-item";

    const left = document.createElement("span");
    left.textContent = `${c.id}: ${c.name}`;
    left.style.cursor = "pointer";
    left.onclick= () => selectChat(c.id, c.name);

    const actions = document.createElement("span");
    actions.className = "actions";

    const btnEdit = document.createElement("button");
    btnEdit.className = "secondary";
    btnEdit.textContent = "Edit";
    btnEdit.onclick = async (e) => {
      e.stopPropagation();

      const newName = prompt("New chat name:", c.name);
      if (!newName || !newName.trim()) return;

      try {
        await api(`/api/chats/${c.id}`, {
          method: "PUT",
          body: JSON.stringify({ name: newName.trim() }),
        });

        if (Number(activeChatId) === Number(c.id)) {
          activeChat.textContent = `Chat #${c.id}: ${newName.trim()}`;
        }

        await loadChats();
      } catch (err) {
        setStatus(err.message);
      }
    };

    const btnDel = document.createElement("button");
    btnDel.className = "danger";
    btnDel.textContent = "Delete";
    btnDel.onclick = async (e) => {
      e.stopPropagation();

      if (!confirm(`Delete chat "${c.name}"?`)) return;

      try {
        await api(`/api/chats/${c.id}`, { method: "DELETE" });

        if (Number(activeChatId) === Number(c.id)) {
          activeChatId = null;
          activeChat.textContent = "No chat selected";
          messagesDiv.innerHTML = "";
        }

        await loadChats();
      } catch (err) {
        setStatus(err.message);
      }
    };

    actions.appendChild(btnEdit);
    actions.appendChild(btnDel);

    li.appendChild(left);
    li.appendChild(actions);

    chatList.appendChild(li);
  }
}

function renderMessage(m) {
  const row = document.createElement("div");
  row.className = "msg";
  row.dataset.messageId = m.id;

  const created = m.created_at ? new Date(m.created_at).toLocaleString() : "";

  const textEl = document.createElement("div");
  textEl.className = "msg-text";
  textEl.textContent = `[${created}] user#${m.user_id}: ${m.text}`;

  const actions = document.createElement("div");
  actions.className = "actions";

  const btnEdit = document.createElement("button");
  btnEdit.className = "secondary";
  btnEdit.textContent = "Edit";
  btnEdit.onclick = async () => {
    if (!activeChatId) return;

    const newText = prompt("Edit message:", m.text);
    if (!newText || !newText.trim()) return;

    try {
      await api(`/api/chats/${activeChatId}/messages/${m.id}`, {
        method: "PUT",
        body: JSON.stringify({ text: newText.trim() }),
      });

      await reloadActiveChatMessages();
    } catch (err) {
      setStatus(err.message);
    }
  };

  const btnDel = document.createElement("button");
  btnDel.className = "danger";
  btnDel.textContent = "Delete";
  btnDel.onclick = async () => {
    if (!activeChatId) return;
    if (!confirm("Delete this message?")) return;

    try {
      await api(`/api/chats/${activeChatId}/messages/${m.id}`, {
        method: "DELETE",
      });

      await reloadActiveChatMessages();
    } catch (err) {
      setStatus(err.message);
    }
  };

  actions.appendChild(btnEdit);
  actions.appendChild(btnDel);

  row.appendChild(textEl);
  row.appendChild(actions);

  messagesDiv.appendChild(row);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function loadChats() {
  const chats = await api("/api/chats");
  renderChats(chats);
}

async function reloadActiveChatMessages() {
  if (!activeChatId) return;
  messagesDiv.innerHTML = "";

  const data = await api(`/api/chats/${activeChatId}/messages`);
  const messages = Array.isArray(data) ? data : (data.messages || []);

  for (const m of messages) renderMessage(m);
}

async function selectChat(id, name) {
  activeChatId = id;
  activeChat.textContent = `Chat #${id}: ${name}`;
  await reloadActiveChatMessages();
}

document.getElementById("btnRegister").onclick = async () => {
  try {
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPass").value.trim();

    const data = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    token = data.token;
    localStorage.setItem("token", token);

    setStatus("Registered + logged in");
    connectWS();
    await loadChats();
  } catch (e) {
    setStatus(e.message);
  }
};

document.getElementById("btnLogin").onclick = async () => {
  try {
    const email = document.getElementById("logEmail").value.trim();
    const password = document.getElementById("logPass").value.trim();

    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    token = data.token;
    localStorage.setItem("token", token);

    setStatus("Logged in");
    connectWS();
    await loadChats();
  } catch (e) {
    setStatus(e.message);
  }
};

document.getElementById("btnLogout").onclick = () => {
  token = "";
  activeChatId = null;
  localStorage.removeItem("token");

  if (ws) ws.close();
  ws = null;

  chatList.innerHTML = "";
  messagesDiv.innerHTML = "";
  activeChat.textContent = "No chat selected";
  setStatus("Logged out");
};

document.getElementById("btnCreateChat").onclick = async () => {
  try {
    const name = document.getElementById("chatName").value.trim();
    if (!name) return;

    await api("/api/chats", {
      method: "POST",
      body: JSON.stringify({ name }),
    });

    document.getElementById("chatName").value = "";
    await loadChats();
  } catch (e) {
    setStatus(e.message);
  }
};

document.getElementById("btnSend").onclick = async () => {
  try {
    if (!activeChatId) return setStatus("Select chat first");

    const text = document.getElementById("msgText").value.trim();
    if (!text) return;

    await api(`/api/chats/${activeChatId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });

    document.getElementById("msgText").value = "";
  } catch (e) {
    setStatus(e.message);
  }
};

if (token) {
  setStatus("Token найден в localStorage");
  connectWS();
  loadChats().catch((e) => setStatus(e.message));
} else {
  setStatus("Not authenticated");
}