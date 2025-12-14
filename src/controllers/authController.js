import bcrypt from "bcrypt";
import { get, run } from "../../db/db.js";
import { signToken } from "../config/jwt.js";

export async function register(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: "email and password required" });
    if (password.length < 4) return res.status(400).json({ message: "password too short" });

    const existing = await get(`SELECT id FROM users WHERE email = ?`, [email]);
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const hash = await bcrypt.hash(password, 10);
    const result = await run(`INSERT INTO users (email, password) VALUES (?, ?)`, [email, hash]);

    const token = signToken({ id: result.lastID, email });
    res.status(201).json({ token });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password required" });

    const user = await get(`SELECT id, email, password FROM users WHERE email = ?`, [email]);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken({ id: user.id, email: user.email });
    res.json({ token });
  } catch (err) {
    next(err);
  }
}