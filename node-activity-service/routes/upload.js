const express = require("express");
const multer = require("multer");
const path = require("node:path");
const fs = require("node:fs");
const router = express.Router();

const uploadDir = path.resolve(process.env.UPLOAD_DIR || "uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const maxMb = Math.min(Math.max(Number(process.env.MAX_UPLOAD_MB || 5), 1), 10);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase().slice(0, 10);
    cb(null, `${Date.now()}-${require("node:crypto").randomUUID()}${safeExt}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: maxMb * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = new Set(["application/pdf", "text/plain", "image/png", "image/jpeg"]);
    if (!allowed.has(file.mimetype)) return cb(new Error("Only PDF, TXT and image files are allowed."));
    cb(null, true);
  }
});

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Upload one file using form field 'file'." });
  // Files are stored locally for demonstration and are not served publicly.
  res.status(201).json({
    message: "File uploaded locally.",
    file: { storedName: req.file.filename, sizeBytes: req.file.size, contentType: req.file.mimetype }
  });
});

module.exports = router;
