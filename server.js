require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { connectDB, closeDB } = require("./config/db");
const authRoutes = require("./routes/auth");
const notesRoutes = require("./routes/notes");
const adminRoutes = require("./routes/admin");
const appEvents = require("./events/appEvents");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // For a production app, replace * with your frontend origin.
});

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Secure Connect API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/admin", adminRoutes);

// Socket.IO JWT authentication: clients must send a valid token in handshake.auth.
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication token required"));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { id: payload.id, username: payload.email };
    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.user.username}`);

  socket.on("join-room", (roomName) => {
    const room = String(roomName || "general").trim().slice(0, 40);
    socket.join(room);
    socket.emit("joined-room", { room });
  });

  socket.on("chat-message", (data = {}) => {
    const room = String(data.room || "general").trim().slice(0, 40);
    const message = String(data.message || "").trim().slice(0, 1000);
    if (!message) return;

    const payload = {
      username: socket.user.username,
      message,
      room,
      sentAt: new Date().toISOString()
    };

    io.to(room).emit("chat-message", payload);
    appEvents.emit("chat:message", { username: socket.user.username, room });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.user.username}`);
  });
});

// Central error handler.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

async function start() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing. Copy .env.example to .env and set it.");
  }
  await connectDB();
  server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
}

start().catch((error) => {
  console.error("Could not start server:", error.message);
  process.exit(1);
});

process.on("SIGINT", async () => {
  await closeDB();
  process.exit(0);
});
