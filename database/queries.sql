-- =============================================================================
-- PROE (Peer Review Orchestration Engine) - SQL Queries & Relationships
-- Component: Person 3 (Database Architecture & DBMS Evaluation)
-- RDBMS Target: MySQL 8.0+
-- =============================================================================

USE proe_db;

-- =============================================================================
-- SECTION 1: CRUD Operations Verification (Day 2 Deliverable)
-- =============================================================================

-- 1.1 CREATE (INSERT): Register a new researcher
INSERT INTO users (name, email, password_hash)
VALUES ('Dr. John von Neumann', 'neumann@ias.edu', '$2a$12$e8p2H1g.d.YlA0C7sZtIiu6K7kL7m7yU8eN8yR7wB8kP4qL2eG7qW');

-- 1.2 READ (SELECT): Retrieve user profile by email (used by LoginServlet)
SELECT user_id, name, email, password_hash, created_at
FROM users
WHERE email = 'neumann@ias.edu';

-- 1.3 UPDATE: Modify user profile name
UPDATE users
SET name = 'Prof. John von Neumann, Institute for Advanced Study'
WHERE email = 'neumann@ias.edu';

-- 1.4 DELETE: Teardown test user (ensures cleanup)
DELETE FROM users
WHERE email = 'neumann@ias.edu';


-- =============================================================================
-- SECTION 2: Production Application Queries (Day 3 Deliverable)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- QUERY 1: Chronological Paper Feed (Newest First)
-- Used by: Person 1 (papers.html) & Person 2 (PaperServlet)
-- Description: Retrieves paper listings sorted by creation date with author name.
-- -----------------------------------------------------------------------------
SELECT 
    p.paper_id,
    p.title,
    p.abstract,
    p.keywords,
    p.paper_url,
    p.created_at,
    u.user_id AS author_id,
    u.name AS author_name,
    u.email AS author_email
FROM papers p
INNER JOIN users u ON p.author_id = u.user_id
ORDER BY p.created_at DESC;

-- Expected Output: 5 rows ordered from Paper 5 (Sep 28) down to Paper 1 (Sep 15).


-- -----------------------------------------------------------------------------
-- QUERY 2: Multi-Attribute Paper Search (Title or Keywords)
-- Used by: Search bar in papers.html
-- Description: Filters papers case-insensitively using title or comma-separated keywords.
-- Parameter: :searchQuery (example below uses '%consensus%')
-- -----------------------------------------------------------------------------
SELECT 
    p.paper_id,
    p.title,
    p.keywords,
    u.name AS author_name,
    p.created_at
FROM papers p
INNER JOIN users u ON p.author_id = u.user_id
WHERE LOWER(p.title) LIKE '%consensus%' 
   OR LOWER(p.keywords) LIKE '%consensus%'
ORDER BY p.created_at DESC;

-- Expected Output: Papers 1 and 5 (matching Byzantine fault tolerance & Paxos/Raft).


-- -----------------------------------------------------------------------------
-- QUERY 3: Single Paper Details by Paper ID
-- Used by: Person 2 (PaperDetailServlet) & Person 1 (paper-details.html)
-- Parameter: :paperId (example below uses 1)
-- -----------------------------------------------------------------------------
SELECT 
    p.paper_id,
    p.title,
    p.abstract,
    p.keywords,
    p.paper_url,
    p.created_at,
    u.user_id AS author_id,
    u.name AS author_name,
    u.email AS author_email
FROM papers p
INNER JOIN users u ON p.author_id = u.user_id
WHERE p.paper_id = 1;

-- Expected Output: Exactly 1 row for Paper 1 with Dr. Alan Turing as the author.


-- -----------------------------------------------------------------------------
-- QUERY 4: Retrieve All Reviews for a Given Paper
-- Used by: Person 2 (ReviewServlet) & Person 1 (paper-details.html)
-- Description: Fetches all submitted reviews along with the reviewer's name.
-- Parameter: :paperId (example below uses 1)
-- -----------------------------------------------------------------------------
SELECT 
    r.review_id,
    r.paper_id,
    r.reviewer_id,
    u.name AS reviewer_name,
    r.rating,
    r.comments,
    r.recommendation,
    r.created_at
FROM reviews r
INNER JOIN users u ON r.reviewer_id = u.user_id
WHERE r.paper_id = 1
ORDER BY r.created_at ASC;

-- Expected Output: 3 rows (Reviews by Ada Lovelace, Claude Shannon, Barbara Liskov).


-- -----------------------------------------------------------------------------
-- QUERY 5: Aggregate Metrics Per Paper (Average Rating, Review Count, Decisions)
-- Used by: Paper cards and author analytics
-- Description: Groups reviews by paper, calculating average score, review count,
--              and acceptance tally using aggregate functions and CASE expressions.
-- -----------------------------------------------------------------------------
SELECT 
    p.paper_id,
    p.title,
    u.name AS author_name,
    COUNT(r.review_id) AS total_reviews,
    ROUND(COALESCE(AVG(r.rating), 0), 2) AS average_rating,
    SUM(CASE WHEN r.recommendation = 'ACCEPT' THEN 1 ELSE 0 END) AS accept_count,
    SUM(CASE WHEN r.recommendation = 'REVISE' THEN 1 ELSE 0 END) AS revise_count,
    SUM(CASE WHEN r.recommendation = 'REJECT' THEN 1 ELSE 0 END) AS reject_count
FROM papers p
INNER JOIN users u ON p.author_id = u.user_id
LEFT JOIN reviews r ON p.paper_id = r.paper_id
GROUP BY p.paper_id, p.title, u.name
ORDER BY average_rating DESC;

-- Expected Output: All 5 papers with their aggregate scores and recommendation tallies.


-- -----------------------------------------------------------------------------
-- QUERY 6: "My Papers" Author Dashboard
-- Used by: Person 2 (MyPapersServlet) & Person 1 (my-papers.html)
-- Description: Fetches all submissions authored by a specific logged-in user,
--              including total review count and current average rating.
-- Parameter: :authorId (example below uses 1 for Alan Turing)
-- -----------------------------------------------------------------------------
SELECT 
    p.paper_id,
    p.title,
    p.paper_url,
    p.created_at,
    COUNT(r.review_id) AS review_count,
    ROUND(COALESCE(AVG(r.rating), 0), 2) AS avg_rating
FROM papers p
LEFT JOIN reviews r ON p.paper_id = r.paper_id
WHERE p.author_id = 1
GROUP BY p.paper_id, p.title, p.paper_url, p.created_at
ORDER BY p.created_at DESC;

-- Expected Output: Paper 1 with 3 reviews and avg_rating of 4.00.


-- -----------------------------------------------------------------------------
-- QUERY 7: Top-Rated Papers Leaderboard (Complex Filter with HAVING)
-- Description: Identifies papers that have an average rating >= 4.00
--              and a minimum of 2 reviews to prevent single-vote bias.
-- -----------------------------------------------------------------------------
SELECT 
    p.paper_id,
    p.title,
    u.name AS author_name,
    COUNT(r.review_id) AS review_count,
    ROUND(AVG(r.rating), 2) AS avg_rating
FROM papers p
INNER JOIN users u ON p.author_id = u.user_id
INNER JOIN reviews r ON p.paper_id = r.paper_id
GROUP BY p.paper_id, p.title, u.name
HAVING COUNT(r.review_id) >= 2 AND AVG(r.rating) >= 4.00
ORDER BY avg_rating DESC, review_count DESC;

-- Expected Output:
--   - Paper 4 (avg 5.00, 2 reviews)
--   - Paper 3 (avg 4.50, 2 reviews)
--   - Paper 1 (avg 4.00, 3 reviews)


-- -----------------------------------------------------------------------------
-- QUERY 8: Subquery — Papers Performing Above System-Wide Average
-- Description: Demonstrates nested subquery filtering against an aggregated scalar.
-- -----------------------------------------------------------------------------
SELECT 
    p.paper_id,
    p.title,
    ROUND(AVG(r.rating), 2) AS paper_avg
FROM papers p
INNER JOIN reviews r ON p.paper_id = r.paper_id
GROUP BY p.paper_id, p.title
HAVING AVG(r.rating) > (
    SELECT AVG(rating) FROM reviews
)
ORDER BY paper_avg DESC;

-- Expected Output: Papers with average rating strictly above the overall system mean (~3.82).


-- -----------------------------------------------------------------------------
-- QUERY 9: Reviewer Activity Statistics
-- Description: Aggregates contribution volume across reviewers.
-- -----------------------------------------------------------------------------
SELECT 
    u.user_id,
    u.name AS reviewer_name,
    u.email,
    COUNT(r.review_id) AS total_reviews_written,
    ROUND(AVG(r.rating), 2) AS average_rating_given
FROM users u
LEFT JOIN reviews r ON u.user_id = r.reviewer_id
GROUP BY u.user_id, u.name, u.email
ORDER BY total_reviews_written DESC, u.name ASC;

-- Expected Output: All 6 users showing count of reviews written and avg rating assigned.
