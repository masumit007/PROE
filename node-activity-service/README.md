# PROE Activity Service — Person 4

Node.js + Express + MongoDB service for recording and summarizing PROE activity events. This is a separate service; the Java/MySQL core workflow should continue working if this service is unavailable.

## Requirements
- Node.js LTS and npm
- MongoDB locally, or a MongoDB Atlas cluster
- Git

## Setup on macOS (Apple Silicon / M2)
1. Install Node.js LTS from https://nodejs.org/ or with Homebrew: `brew install node`.
2. From the repository root, enter this folder:
   ```bash
   cd activity-service
   npm install
   cp .env.example .env
   ```
3. Edit `.env` and set `MONGODB_URI` and `MONGODB_DB`.
   - Local MongoDB: `mongodb://127.0.0.1:27017`
   - Atlas: use your cluster connection URI, add your IP to Atlas Network Access, and create a database user. Never commit `.env`.
4. Start MongoDB if using a local installation, then run:
   ```bash
   npm run check
   npm test
   npm start
   ```
5. Visit `http://localhost:3000/api/health`. A healthy response includes `"database":"connected"`.

## API
Base URL: `http://localhost:3000`

### Health
`GET /api/health`

### Create activity event
`POST /api/activity` with JSON:
```json
{
  "eventType": "PAPER_SUBMITTED",
  "userId": 12,
  "paperId": 45,
  "details": {"source": "java-backend"}
}
```
Allowed `eventType` values: `PAPER_SUBMITTED`, `REVIEW_SUBMITTED`, `USER_REGISTERED`, `USER_LOGIN`, `PAPER_VIEWED`.

### List events
`GET /api/activity?limit=20`
Optional filters: `eventType`, `userId`. Limit is capped at 100.

### Summary aggregation
`GET /api/activity/summary`

### Upload demo
Use Postman `POST /api/upload` → Body → form-data → key `file` (type File). Allows PDF, TXT, PNG, JPEG up to configured size. Uploaded files are kept in the local `uploads/` folder and are not publicly served. MIME checks are a basic demonstration, not complete malware/content validation.

## Node.js syllabus demonstration
Run `node scripts/fs-url-events-demo.js` to demonstrate File System, URL and EventEmitter modules.

## Optional email demonstration
Set SMTP variables in `.env`, install `npm install nodemailer`, and run `node scripts/send-email.js`. Use a test SMTP account and do not commit credentials. The script exits safely when not configured.

## Postman smoke tests
1. `GET http://localhost:3000/api/health`
2. `POST http://localhost:3000/api/activity` with the sample JSON above; expect `201`.
3. `GET http://localhost:3000/api/activity`
4. `GET http://localhost:3000/api/activity/summary`
5. Send invalid `eventType`; expect `400`.
6. Upload a permitted small file to `POST /api/upload`.

## Integration with Java
After Java successfully saves a paper/review, it may send a server-to-server POST to `http://localhost:3000/api/activity`. The Java operation must not fail if the activity service is unavailable. If the browser calls this service directly, set `CORS_ORIGIN` to the actual frontend origin.

## Troubleshooting
- `MONGODB_URI is missing`: copy `.env.example` to `.env`.
- Connection refused: make sure local MongoDB is running, or use Atlas URI.
- Atlas authentication/network error: verify DB user, password URL encoding, IP allowlist and database permissions.
- Port busy: change `PORT` in `.env`.
<!-- Testing Jenkins automatic builds -->
