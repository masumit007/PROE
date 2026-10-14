const express = require("express");
const { getDb } = require("../services/mongo");
const { logEvent } = require("../services/eventLogger");
const router = express.Router();

const allowedTypes = new Set([
  "PAPER_SUBMITTED",
  "REVIEW_SUBMITTED",
  "USER_REGISTERED",
  "USER_LOGIN",
  "PAPER_VIEWED"
]);

router.post("/", async (req, res, next) => {
  try {
    const { eventType, userId, paperId = null, details = {} } = req.body || {};
    if (!allowedTypes.has(eventType)) {
      return res.status(400).json({ error: "eventType is missing or invalid.", allowedTypes: [...allowedTypes] });
    }
    if (userId === undefined || userId === null || String(userId).trim() === "") {
      return res.status(400).json({ error: "userId is required." });
    }
    if (typeof details !== "object" || Array.isArray(details)) {
      return res.status(400).json({ error: "details must be a JSON object." });
    }

    const event = {
      eventType,
      userId: String(userId).slice(0, 100),
      paperId: paperId === null ? null : String(paperId).slice(0, 100),
      details,
      timestamp: new Date()
    };
    const result = await getDb().collection("activity_events").insertOne(event);
    logEvent(event);
    return res.status(201).json({ message: "Activity recorded.", id: result.insertedId, event });
  } catch (err) { next(err); }
});

router.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || "50", 10) || 50, 1), 100);
    const filter = {};
    if (req.query.eventType) {
      if (!allowedTypes.has(req.query.eventType)) return res.status(400).json({ error: "Invalid eventType filter." });
      filter.eventType = req.query.eventType;
    }
    if (req.query.userId) filter.userId = String(req.query.userId);
    const events = await getDb().collection("activity_events")
      .find(filter).sort({ timestamp: -1 }).limit(limit).toArray();
    res.json({ count: events.length, events });
  } catch (err) { next(err); }
});

router.get("/summary", async (_req, res, next) => {
  try {
    const summary = await getDb().collection("activity_events").aggregate([
      { $group: { _id: "$eventType", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $project: { _id: 0, eventType: "$_id", count: 1 } }
    ]).toArray();
    const total = summary.reduce((sum, item) => sum + item.count, 0);
    res.json({ totalEvents: total, summary });
  } catch (err) { next(err); }
});

module.exports = router;
