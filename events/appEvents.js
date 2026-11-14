const EventEmitter = require("events");

const appEvents = new EventEmitter();

// Event-driven features: log important application activities.
appEvents.on("user:registered", ({ email }) => {
  console.log(`[EVENT] New user registered: ${email}`);
});

appEvents.on("note:created", ({ ownerId, title }) => {
  console.log(`[EVENT] Note created by ${ownerId}: ${title}`);
});

appEvents.on("chat:message", ({ username, room }) => {
  console.log(`[EVENT] ${username} sent a message in ${room}`);
});

module.exports = appEvents;
