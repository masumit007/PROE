# PROE MySQL API — local demo

Separate from `node-activity-service` (MongoDB). This API uses the existing `proe_db` database and never runs schema/seed/reset scripts.

## 1. Create a dedicated local database account
Run in MySQL, choosing your own strong password:

```sql
CREATE USER 'proe_app'@'127.0.0.1' IDENTIFIED BY 'CHOOSE_A_STRONG_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON proe_db.* TO 'proe_app'@'127.0.0.1';
FLUSH PRIVILEGES;
```
If your local MySQL connection uses a different host, adjust the account host accordingly. Don't use root for the app.

## 2. Configure and start
```bash
cd ~/Downloads/PROE-team/mysql-api
cp .env.example .env
```
Edit `.env` locally to set `DB_PASSWORD`. Never commit `.env`.

```bash
npm install
npm run check
npm start
```
Health check: http://127.0.0.1:3001/api/health

## Endpoints
- GET `/api/dashboard`
- GET/POST `/api/users`; PATCH/DELETE `/api/users/:id`
- GET/POST `/api/papers`; PATCH/DELETE `/api/papers/:id`
- GET/POST `/api/reviews`; PATCH/DELETE `/api/reviews/:id`
- GET `/api/audit-logs?limit=100`

The API never returns password hashes. Existing MySQL constraints/triggers remain authoritative. Note that deleting a user may be rejected when existing reviews reference them. Paper deletion follows your database's configured foreign-key behavior.

## Frontend integration
This API is optional: the web pages use the Java servlet app (`java-app`) for login, paper upload and the papers list. If you point a page at this API, set `CORS_ORIGIN` in `.env` to the exact origin serving the pages (for example `http://127.0.0.1:5500`); several origins can be comma-separated. Browser code must never connect directly to MySQL. This API has no authentication.
