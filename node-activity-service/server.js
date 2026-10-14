require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectToMongo, closeMongo } = require("./services/mongo");
const activityRoutes = require("./routes/activity");
const uploadRoutes = require("./routes/upload");
const { logEvent } = require("./services/eventLogger");

const app = express();
const port = Number(process.env.PORT || 3000);
const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:8080";

app.use(cors({ origin: allowedOrigin === "*" ? true : allowedOrigin.split(",").map(s => s.trim()) }));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.json({ service: "PROE Activity Service", status: "running", health: "/api/health" });
});

app.get("/api/health", async (_req, res) => {
  try {
    const db = await connectToMongo();
    await db.command({ ping: 1 });
    res.json({ status: "ok", service: "proe-activity-service", database: "connected" });
  } catch (err) {
    res.status(503).json({ status: "degraded", service: "proe-activity-service", database: "unavailable" });
  }
});

app.use("/api/activity", activityRoutes);
app.use("/api/upload", uploadRoutes);

app.use((err, _req, res, _next) => {
  console.error(err.message);
  if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "File exceeds the configured size limit." });
  if (err.message === "Only PDF, TXT and image files are allowed.") return res.status(400).json({ error: err.message });
  res.status(500).json({ error: "Internal server error." });
});

let server;
async function start() {
  try {
    await connectToMongo();
    server = app.listen(port, () => console.log(`PROE activity service running at http://localhost:${port}`));
  } catch (err) {
    console.error("Could not connect to MongoDB:", err.message);
    console.error("Check MONGODB_URI and make sure MongoDB is running/reachable.");
    process.exitCode = 1;
  }
}

async function shutdown() {
  if (server) server.close();
  await closeMongo();
}
if (require.main === module) {
  start();
  process.on("SIGINT", async () => { await shutdown(); process.exit(0); });
  process.on("SIGTERM", async () => { await shutdown(); process.exit(0); });
}

module.exports = { app, start };
