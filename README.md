# PROE — Paper Submission and Review Management System

Static web pages (`web/`) talking to a Java servlet app (Tomcat) backed by MySQL.
Two extra Node/Spring services are optional and not used by the web pages.

## Components and ports

| Component | Folder | Address | Used by the web pages? |
|---|---|---|---|
| Web pages (VS Code **Live Server**) | `web/` | http://127.0.0.1:5500 | – |
| Java servlet app (Tomcat 10.1+, context `proe`) | `java-app/` | http://127.0.0.1:8081/proe | **Yes** – register, login, submit paper, list papers |
| Express + MySQL admin API | `mysql-api/` | http://127.0.0.1:3001 | No (optional) |
| Node activity service (MongoDB) | `node-activity-service/` | http://127.0.0.1:3000 | No |
| Spring Boot activity service | `activity-service/` | http://127.0.0.1:8082 | No |
| MySQL database `proe_db` | `database/` | 127.0.0.1:3306 | by the Java app |

Always use `127.0.0.1` (not `localhost`) in the browser and in code: the login session cookie is tied to the host name.

## Run order

1. **Database** – load `database/schema.sql`, then `database/seed.sql`, into MySQL.
   The users in `seed.sql` share a placeholder password hash, so **nobody can log in as a seeded user**. Create your own account on the register page.
2. **Java app** – build with `cd java-app && mvn package`, deploy `target/proe.war` to Tomcat 10.1+ and set Tomcat's HTTP port to **8081** (`conf/server.xml`). Set these environment variables for Tomcat:
   `PROE_DB_URL`, `PROE_DB_USER`, `PROE_DB_PASSWORD`.
   Uploaded PDFs are stored in the folder given by `PROE_UPLOAD_DIR` (or `-Dproe.upload.dir=...`). If unset: `D:\PROE\uploads` on Windows when drive D: exists, otherwise `~/proe-uploads`.
3. **Web pages** – open `web/` in VS Code and start Live Server on port 5500, then browse to **http://127.0.0.1:5500/index.html**. The Java app only allows CORS from `127.0.0.1:5500` and `localhost:5500`.
4. **Use it** – register, log in (you are sent to the submit page), attach a PDF (max 10 MB), review and submit. The Papers page lists submitted papers; PDFs open only while you are logged in.

Optional: `mysql-api` (see its README), `node-activity-service`, `activity-service`. If you run the Express API, set `CORS_ORIGIN` in its `.env` to the origin serving the pages.

## What the pages call

| Page | Request |
|---|---|
| `register.html` | `POST /proe/api/auth/register` |
| `login.html` | `POST /proe/api/auth/login` (session cookie) |
| `submit-paper.html` | `POST /proe/api/papers/upload` – multipart fields `title`, `abstract`, `keywords`, `pdf`; the author comes from the session |
| `papers.html` | `GET /proe/api/papers` (falls back to sample cards if the server is unreachable) |

`keywords` is limited to 255 characters (the form sends the topic first, then your keywords).

## Frontend pages

- **Home** – introduction, navigation, sample research cards.
- **Papers** – live list with search, category filter and sorting.
- **Login / Register** – forms with client-side validation.
- **Submit Research** – full form with PDF drag-and-drop, draft saving (text only, never the PDF), review dialog and upload.

## Known limitations

- Seed users cannot log in (placeholder hash).
- The Papers API returns the author's ID, not name, so the cards do not show author names.
- The Express API has no authentication; do not expose it beyond your machine.
