const { EventEmitter } = require("node:events");
const eventBus = new EventEmitter();

eventBus.on("activity:created", event => {
  // Demonstrates Node.js EventEmitter. Keep this lightweight; database persistence is handled by the route.
  console.log(`[event] ${event.eventType} recorded for user ${event.userId}`);
});

function logEvent(event) {
  eventBus.emit("activity:created", event);
}
module.exports = { eventBus, logEvent };
