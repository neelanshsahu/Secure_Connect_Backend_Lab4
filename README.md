# Secure Connect and Communication Platform
**Backend Lab 4 | Web Dev III | Unit 4**

A Node.js backend demonstrating signup/login, bcrypt password hashing, JWT authentication, protected routes, role-based access control (RBAC), a personal Notes CRUD API, Socket.IO real-time chat, dotenv configuration and Node.js EventEmitter events.

## 1. Requirements
- Node.js 18+
- MongoDB running locally, or a MongoDB connection URI
- Postman (for REST API testing)

## 2. Installation
```bash
npm install
```

Copy `.env.example` to `.env`, then update the values:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017
DB_NAME=secure_connect
JWT_SECRET=use_a_long_random_secret_here
JWT_EXPIRES_IN=1d
BCRYPT_ROUNDS=10
ADMIN_EMAIL=admin@example.com
```
Keep `.env` private. Never upload it to GitHub.

Start MongoDB, then run:
```bash
npm run dev
```
or:
```bash
npm start
```
Server: `http://localhost:5000`

## 3. REST API testing in Postman

All request bodies below use **Body → raw → JSON**.

### A. Signup
`POST http://localhost:5000/api/auth/signup`
```json
{
  "username": "victor",
  "email": "victor@example.com",
  "password": "123456"
}
```
Expected: `201 Created`, with a user object. The password is stored as a bcrypt hash, never as plain text.

### B. Login
`POST http://localhost:5000/api/auth/login`
```json
{
  "email": "victor@example.com",
  "password": "123456"
}
```
Expected: `200 OK`, `Login successful`, and a JWT token. Copy the token.

### C. Protected notes request
`GET http://localhost:5000/api/notes`

Header:
```text
Authorization: Bearer YOUR_JWT_TOKEN
```
Without a token, expected: `401` and `{"message":"No token provided"}`.

### D. Create note
`POST http://localhost:5000/api/notes`

Header: `Authorization: Bearer YOUR_JWT_TOKEN`

Body:
```json
{
  "title": "My First Note",
  "content": "This is my first note of Web Dev III."
}
```
Expected: `201 Created` and the saved note with its owner ID and timestamps.

### E. Read all my notes
`GET http://localhost:5000/api/notes`

Returns only notes belonging to the authenticated user.

### F. Update note
`PUT http://localhost:5000/api/notes/NOTE_ID`

Body:
```json
{
  "title": "Updated Note",
  "content": "The note content has been updated."
}
```

### G. Delete note
`DELETE http://localhost:5000/api/notes/NOTE_ID`

Expected: `{"message":"Note deleted successfully"}`.

### H. Admin-only route
`GET http://localhost:5000/api/admin/users`

Create an account using the email configured in `ADMIN_EMAIL` to receive the `admin` role. Send its JWT as a Bearer token. Normal users receive `403 Forbidden`.

## 4. Real-time chat testing

The Socket.IO server authenticates the connection using the same JWT returned by login. A Socket.IO client can connect as follows:

```javascript
const { io } = require("socket.io-client");

const socket = io("http://localhost:5000", {
  auth: { token: "YOUR_JWT_TOKEN" }
});

socket.on("connect", () => {
  socket.emit("join-room", "general");
  socket.emit("chat-message", {
    room: "general",
    message: "Hello everyone!"
  });
});

socket.on("chat-message", (data) => {
  console.log(data);
});
```

For a separate test client, install the client package in that test project:
```bash
npm install socket.io-client
```
Open two clients with valid tokens and join the same `general` room. Messages are broadcast to everyone in that room.

## 5. Event-driven features
`events/appEvents.js` uses Node.js `EventEmitter`. It logs:
- `user:registered` after signup
- `note:created` after a note is saved
- `chat:message` after a chat message is broadcast

## 6. Main folder structure
```text
secure-connect-platform/
├── config/
│   └── db.js
├── events/
│   └── appEvents.js
├── middleware/
│   └── auth.js
├── routes/
│   ├── admin.js
│   ├── auth.js
│   └── notes.js
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## 7. Security implemented
- Passwords are hashed with bcrypt.
- JWTs are signed with a secret stored in `.env`.
- Protected routes verify the JWT.
- Notes queries include the authenticated user's ID, preventing users from reading or changing another user's notes.
- Admin route checks the user's role.
- Socket.IO connections require a valid JWT.
- Request values are validated and chat messages are length-limited.

## 8. Lab conclusion
The Secure Connect and Communication Platform demonstrates authentication and authorization using bcrypt and JWT, protected REST APIs, user-specific CRUD operations, role-based access control, real-time communication through Socket.IO, and event-driven programming using EventEmitter. MongoDB stores users and notes persistently.
