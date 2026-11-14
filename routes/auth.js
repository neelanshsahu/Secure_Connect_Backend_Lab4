const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getDB } = require("../config/db");
const appEvents = require("../events/appEvents");

const router = express.Router();

router.post("/signup", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const users = getDB().collection("users");
    const existing = await users.findOne({ email: normalizedEmail });

    if (existing) return res.status(409).json({ message: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS) || 10);
    const role = normalizedEmail === (process.env.ADMIN_EMAIL || "").toLowerCase() ? "admin" : "user";

    const result = await users.insertOne({
      username: username.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      createdAt: new Date()
    });

    appEvents.emit("user:registered", { email: normalizedEmail });

    return res.status(201).json({
      message: "User registered",
      user: { id: result.insertedId, username: username.trim(), email: normalizedEmail, role }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await getDB().collection("users").findOne({
      email: email.trim().toLowerCase()
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
