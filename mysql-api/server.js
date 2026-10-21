
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const crypto = require('node:crypto');
const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');

const app = express();

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 3001);
const UPLOAD_DIR = path.join(__dirname, 'uploads');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'proe_app',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'proe_db',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

// Middleware
app.use(cors({ origin: origins }));
app.use(express.json({ limit: '100kb' }));

// Serve uploaded PDFs as downloads.
app.use('/uploads', express.static(UPLOAD_DIR, {
  dotfiles: 'deny',
  index: false,
  setHeaders: res => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'attachment');
  }
}));

// Helpers
const run = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const rows = async (sql, values = []) =>
  (await pool.execute(sql, values))[0];

const idOf = value =>
  Number.isSafeInteger(Number(value)) && Number(value) > 0
    ? Number(value)
    : null;

// PDF upload configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    cb(null, `${crypto.randomUUID()}.pdf`);
  }
});

const uploadPdf = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1
  },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype !== 'application/pdf' ||
      !file.originalname.toLowerCase().endsWith('.pdf')
    ) {
      return cb(new Error('Only PDF files are allowed.'));
    }

    cb(null, true);
  }
});

// Home
app.get('/', (_req, res) => {
  res.json({
    service: 'PROE MySQL API',
    status: 'running'
  });
});

// Health check
app.get('/api/health', run(async (_req, res) => {
  await rows('SELECT 1');

  res.json({
    status: 'ok',
    database: process.env.DB_NAME || 'proe_db'
  });
}));

// Dashboard counts
app.get('/api/dashboard', run(async (_req, res) => {
  const tables = ['users', 'papers', 'reviews', 'audit_logs'];

  const counts = await Promise.all(
    tables.map(async table => {
      const result = await rows(
        `SELECT COUNT(*) AS n FROM ${table}`
      );
      return Number(result[0].n);
    })
  );

  res.json({
    users: counts[0],
    papers: counts[1],
    reviews: counts[2],
    auditLogs: counts[3]
  });
}));

// USERS
app.get('/api/users', run(async (_req, res) => {
  res.json(await rows(
    'SELECT user_id, name, email, created_at FROM users ORDER BY user_id DESC'
  ));
}));

app.post('/api/users', run(async (req, res) => {
  const { name, email, password } = req.body || {};

  if (
    typeof name !== 'string' || !name.trim() ||
    typeof email !== 'string' || !email.trim() ||
    typeof password !== 'string' || password.length < 8
  ) {
    return res.status(400).json({
      error: 'Name, email and password (at least 8 characters) are required.'
    });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');

  const [result] = await pool.execute(
    'INSERT INTO users(name, email, password_hash) VALUES(?,?,?)',
    [name.trim(), email.trim(), `${salt}:${hash}`]
  );

  res.status(201).json({
    user_id: result.insertId,
    name: name.trim(),
    email: email.trim()
  });
}));

app.patch('/api/users/:id', run(async (req, res) => {
  const id = idOf(req.params.id);
  const { name, email } = req.body || {};

  if (
    !id ||
    typeof name !== 'string' || !name.trim() ||
    typeof email !== 'string' || !email.trim()
  ) {
    return res.status(400).json({
      error: 'Valid id, name and email are required.'
    });
  }

  const [result] = await pool.execute(
    'UPDATE users SET name=?, email=? WHERE user_id=?',
    [name.trim(), email.trim(), id]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({ updated: true });
}));

app.delete('/api/users/:id', run(async (req, res) => {
  const id = idOf(req.params.id);

  if (!id) {
    return res.status(400).json({ error: 'Invalid id.' });
  }

  const [result] = await pool.execute(
    'DELETE FROM users WHERE user_id=?',
    [id]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({ deleted: true });
}));

// PAPERS: list papers
app.get('/api/papers', run(async (_req, res) => {
  res.json(await rows(`
    SELECT
      p.paper_id,
      p.author_id,
      u.name AS author_name,
      p.title,
      p.abstract,
      p.keywords,
      p.paper_url,
      p.created_at
    FROM papers p
    JOIN users u ON u.user_id = p.author_id
    ORDER BY p.paper_id DESC
  `));
}));

// PAPERS: upload a PDF and create its database record
app.post('/api/papers/upload', (req, res, next) => {
  uploadPdf.single('file')(req, res, err => {
    if (err) {
      const status = err instanceof multer.MulterError ? 400 : 400;

      return res.status(status).json({
        error: err.message || 'PDF upload failed.'
      });
    }

    next();
  });
}, run(async (req, res) => {
  const { author_id, title, abstract, keywords } = req.body || {};

  if (
    !idOf(author_id) ||
    typeof title !== 'string' || !title.trim() ||
    typeof abstract !== 'string' || !abstract.trim() ||
    typeof keywords !== 'string' || !keywords.trim() ||
    !req.file
  ) {
    if (req.file) {
      await fs.promises.unlink(req.file.path).catch(() => {});
    }

    return res.status(400).json({
      error: 'Author, title, abstract, keywords and PDF file are required.'
    });
  }

  let signature;

  try {
    const fd = await fs.promises.open(req.file.path, 'r');

    try {
      const buffer = Buffer.alloc(5);
      const result = await fd.read(buffer, 0, 5, 0);
      signature = result.bytesRead === 5 ? buffer.toString() : '';
    } finally {
      await fd.close();
    }

    if (signature !== '%PDF-') {
      await fs.promises.unlink(req.file.path).catch(() => {});

      return res.status(400).json({
        error: 'The uploaded file does not have a valid PDF signature.'
      });
    }

    const paperUrl = `/uploads/${req.file.filename}`;

    const [result] = await pool.execute(
      `INSERT INTO papers
       (author_id, title, abstract, keywords, paper_url)
       VALUES (?, ?, ?, ?, ?)`,
      [
        idOf(author_id),
        title.trim(),
        abstract.trim(),
        keywords.trim(),
        paperUrl
      ]
    );

    res.status(201).json({
      message: 'Paper submitted successfully.',
      paper_id: result.insertId,
      paper_url: paperUrl
    });
  } catch (error) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    throw error;
  }
}));

// PAPERS: create metadata without a file
app.post('/api/papers', run(async (req, res) => {
  const { author_id, title, abstract, keywords, paper_url } = req.body || {};

  if (
    !idOf(author_id) ||
    ![title, abstract, keywords, paper_url].every(
      value => typeof value === 'string' && value.trim()
    )
  ) {
    return res.status(400).json({
      error: 'Author, title, abstract, keywords and paper URL are required.'
    });
  }

  const [result] = await pool.execute(
    `INSERT INTO papers
     (author_id, title, abstract, keywords, paper_url)
     VALUES (?, ?, ?, ?, ?)`,
    [
      idOf(author_id),
      title.trim(),
      abstract.trim(),
      keywords.trim(),
      paper_url.trim()
    ]
  );

  res.status(201).json({ paper_id: result.insertId });
}));

app.patch('/api/papers/:id', run(async (req, res) => {
  const id = idOf(req.params.id);
  const { author_id, title, abstract, keywords, paper_url } = req.body || {};

  if (
    !id || !idOf(author_id) ||
    ![title, abstract, keywords, paper_url].every(
      value => typeof value === 'string' && value.trim()
    )
  ) {
    return res.status(400).json({
      error: 'All paper fields are required.'
    });
  }

  const [result] = await pool.execute(
    `UPDATE papers
     SET author_id=?, title=?, abstract=?, keywords=?, paper_url=?
     WHERE paper_id=?`,
    [
      idOf(author_id),
      title.trim(),
      abstract.trim(),
      keywords.trim(),
      paper_url.trim(),
      id
    ]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ error: 'Paper not found.' });
  }

  res.json({ updated: true });
}));

app.delete('/api/papers/:id', run(async (req, res) => {
  const id = idOf(req.params.id);

  if (!id) {
    return res.status(400).json({ error: 'Invalid id.' });
  }

  const [result] = await pool.execute(
    'DELETE FROM papers WHERE paper_id=?',
    [id]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ error: 'Paper not found.' });
  }

  res.json({ deleted: true });
}));

// REVIEWS
app.get('/api/reviews', run(async (_req, res) => {
  res.json(await rows(`
    SELECT
      r.review_id,
      r.paper_id,
      p.title AS paper_title,
      r.reviewer_id,
      u.name AS reviewer_name,
      r.rating,
      r.comments,
      r.recommendation,
      r.created_at
    FROM reviews r
    JOIN papers p ON p.paper_id = r.paper_id
    JOIN users u ON u.user_id = r.reviewer_id
    ORDER BY r.review_id DESC
  `));
}));

app.post('/api/reviews', run(async (req, res) => {
  const {
    paper_id,
    reviewer_id,
    rating,
    comments,
    recommendation
  } = req.body || {};

  if (
    !idOf(paper_id) ||
    !idOf(reviewer_id) ||
    !Number.isInteger(Number(rating)) ||
    Number(rating) < 1 ||
    Number(rating) > 5 ||
    typeof comments !== 'string' ||
    !comments.trim() ||
    !['ACCEPT', 'REVISE', 'REJECT'].includes(recommendation)
  ) {
    return res.status(400).json({
      error: 'Valid paper, reviewer, rating 1–5, comments and recommendation are required.'
    });
  }

  const [result] = await pool.execute(
    `INSERT INTO reviews
     (paper_id, reviewer_id, rating, comments, recommendation)
     VALUES (?, ?, ?, ?, ?)`,
    [
      idOf(paper_id),
      idOf(reviewer_id),
      Number(rating),
      comments.trim(),
      recommendation
    ]
  );

  res.status(201).json({ review_id: result.insertId });
}));

app.patch('/api/reviews/:id', run(async (req, res) => {
  const id = idOf(req.params.id);
  const { rating, comments, recommendation } = req.body || {};

  if (
    !id ||
    !Number.isInteger(Number(rating)) ||
    Number(rating) < 1 ||
    Number(rating) > 5 ||
    typeof comments !== 'string' ||
    !comments.trim() ||
    !['ACCEPT', 'REVISE', 'REJECT'].includes(recommendation)
  ) {
    return res.status(400).json({
      error: 'Valid rating, comments and recommendation are required.'
    });
  }

  const [result] = await pool.execute(
    `UPDATE reviews
     SET rating=?, comments=?, recommendation=?
     WHERE review_id=?`,
    [Number(rating), comments.trim(), recommendation, id]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ error: 'Review not found.' });
  }

  res.json({ updated: true });
}));

app.delete('/api/reviews/:id', run(async (req, res) => {
  const id = idOf(req.params.id);

  if (!id) {
    return res.status(400).json({ error: 'Invalid id.' });
  }

  const [result] = await pool.execute(
    'DELETE FROM reviews WHERE review_id=?',
    [id]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ error: 'Review not found.' });
  }

  res.json({ deleted: true });
}));

// AUDIT LOGS
app.get('/api/audit-logs', run(async (req, res) => {
  const limit = Math.min(
    200,
    Math.max(1, Number(req.query.limit) || 100)
  );

  res.json(await rows(
    `SELECT log_id, table_name, action_type, record_id,
            description, created_at
     FROM audit_logs
     ORDER BY log_id DESC
     LIMIT ${limit}`
  ));
}));

// Central error handler
app.use((err, _req, res, _next) => {
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      error: 'Duplicate email or review already exists.'
    });
  }

  if (
    ['ER_NO_REFERENCED_ROW_2', 'ER_ROW_IS_REFERENCED_2']
      .includes(err.code)
  ) {
    return res.status(409).json({
      error: 'Database relationship constraint prevented this operation.'
    });
  }

  if (err.sqlState === '45000') {
    return res.status(400).json({
      error: err.sqlMessage || 'Database business rule rejected this operation.'
    });
  }

  console.error(err.message);

  res.status(500).json({
    error: 'Database operation failed; inspect the local API terminal.'
  });
});

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`PROE MySQL API listening at http://${HOST}:${PORT}`);
  });
}

module.exports = { app, pool };
