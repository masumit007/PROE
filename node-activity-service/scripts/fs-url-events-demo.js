// Demonstrates Node.js File System, URL parsing and EventEmitter modules.
const fs = require("node:fs/promises");
const path = require("node:path");
const { URL } = require("node:url");
const { eventBus } = require("../services/eventLogger");

async function main() {
  const parsed = new URL("http://localhost:3000/api/activity?eventType=PAPER_SUBMITTED&limit=10");
  console.log("URL pathname:", parsed.pathname);
  console.log("URL eventType query:", parsed.searchParams.get("eventType"));

  const logPath = path.join(__dirname, "..", "demo-activity.log");
  await fs.appendFile(logPath, `${new Date().toISOString()} demo ran\n`, "utf8");
  console.log("Wrote log:", logPath);

  eventBus.once("demo:complete", payload => console.log("Event handled:", payload));
  eventBus.emit("demo:complete", { success: true, topic: "Node.js Events" });
}
main().catch(err => { console.error(err); process.exitCode = 1; });
