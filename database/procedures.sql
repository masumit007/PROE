-- =============================================================================
-- PROE (Peer Review Orchestration Engine) - Stored Procedures
-- Component: Person 3 (Database Architecture & DBMS Evaluation)
-- RDBMS Target: MySQL 8.0+
-- =============================================================================

USE proe_db;

DROP PROCEDURE IF EXISTS sp_get_paper_review_summary;
DROP PROCEDURE IF EXISTS sp_submit_paper;
DROP PROCEDURE IF EXISTS sp_get_author_portfolio;

DELIMITER //

-- -----------------------------------------------------------------------------
-- PROCEDURE 1: sp_get_paper_review_summary
-- Purpose: Retrieves a comprehensive summary of a paper including author info,
--          aggregate metrics (avg rating, count, max, min, recommendations),
--          and returns the full set of submitted reviews.
-- Parameters:
--   - IN p_paper_id (INT UNSIGNED): Paper identifier
-- -----------------------------------------------------------------------------
CREATE PROCEDURE sp_get_paper_review_summary (
    IN p_paper_id INT UNSIGNED
)
BEGIN
    -- Result Set 1: Paper metadata and aggregate evaluation metrics
    SELECT 
        p.paper_id,
        p.title,
        p.abstract,
        p.keywords,
        p.paper_url,
        p.created_at AS submission_date,
        u.name AS author_name,
        u.email AS author_email,
        COUNT(r.review_id) AS total_reviews,
        ROUND(COALESCE(AVG(r.rating), 0), 2) AS average_rating,
        COALESCE(MIN(r.rating), 0) AS minimum_rating,
        COALESCE(MAX(r.rating), 0) AS maximum_rating,
        SUM(CASE WHEN r.recommendation = 'ACCEPT' THEN 1 ELSE 0 END) AS accept_count,
        SUM(CASE WHEN r.recommendation = 'REVISE' THEN 1 ELSE 0 END) AS revise_count,
        SUM(CASE WHEN r.recommendation = 'REJECT' THEN 1 ELSE 0 END) AS reject_count,
        fn_get_editorial_verdict(p.paper_id) AS editorial_verdict
    FROM papers p
    INNER JOIN users u ON p.author_id = u.user_id
    LEFT JOIN reviews r ON p.paper_id = r.paper_id
    WHERE p.paper_id = p_paper_id
    GROUP BY p.paper_id, u.name, u.email;

    -- Result Set 2: Individual review records for the paper
    SELECT 
        r.review_id,
        r.reviewer_id,
        u.name AS reviewer_name,
        r.rating,
        r.comments,
        r.recommendation,
        r.created_at AS review_date
    FROM reviews r
    INNER JOIN users u ON r.reviewer_id = u.user_id
    WHERE r.paper_id = p_paper_id
    ORDER BY r.created_at ASC;
END //

-- -----------------------------------------------------------------------------
-- PROCEDURE 2: sp_submit_paper
-- Purpose: Encapsulates transactional creation of a research paper manuscript.
-- Validates:
--   - Author exists in users table
--   - Title and abstract are not empty
-- Parameters:
--   - IN p_author_id (INT UNSIGNED)
--   - IN p_title (VARCHAR(255))
--   - IN p_abstract (TEXT)
--   - IN p_keywords (VARCHAR(255))
--   - IN p_paper_url (VARCHAR(500))
--   - OUT p_new_paper_id (INT UNSIGNED)
-- -----------------------------------------------------------------------------
CREATE PROCEDURE sp_submit_paper (
    IN p_author_id INT UNSIGNED,
    IN p_title VARCHAR(255),
    IN p_abstract TEXT,
    IN p_keywords VARCHAR(255),
    IN p_paper_url VARCHAR(500),
    OUT p_new_paper_id INT UNSIGNED
)
BEGIN
    DECLARE v_author_exists INT DEFAULT 0;

    -- Exception handling for rollback
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Validate author existence
    SELECT COUNT(*) INTO v_author_exists
    FROM users
    WHERE user_id = p_author_id;

    IF v_author_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validation Error: Author does not exist in users table.';
    END IF;

    -- Validate required fields
    IF TRIM(p_title) = '' OR TRIM(p_abstract) = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validation Error: Paper title and abstract cannot be empty.';
    END IF;

    -- Insert new manuscript
    INSERT INTO papers (author_id, title, abstract, keywords, paper_url, created_at)
    VALUES (p_author_id, p_title, p_abstract, p_keywords, p_paper_url, NOW());

    SET p_new_paper_id = LAST_INSERT_ID();

    COMMIT;
END //

-- -----------------------------------------------------------------------------
-- PROCEDURE 3: sp_get_author_portfolio
-- Purpose: Returns all submissions authored by a specific researcher,
--          complete with review counts and editorial statuses.
-- Parameters:
--   - IN p_author_id (INT UNSIGNED)
-- -----------------------------------------------------------------------------
CREATE PROCEDURE sp_get_author_portfolio (
    IN p_author_id INT UNSIGNED
)
BEGIN
    SELECT 
        p.paper_id,
        p.title,
        p.created_at AS submission_date,
        COUNT(r.review_id) AS review_count,
        ROUND(COALESCE(AVG(r.rating), 0), 2) AS average_rating,
        fn_get_editorial_verdict(p.paper_id) AS editorial_verdict
    FROM papers p
    LEFT JOIN reviews r ON p.paper_id = r.paper_id
    WHERE p.author_id = p_author_id
    GROUP BY p.paper_id, p.title, p.created_at
    ORDER BY p.created_at DESC;
END //

DELIMITER ;


-- =============================================================================
-- VERIFICATION & DEMONSTRATION TESTS (DBMS Evaluation Rubric Proof)
-- =============================================================================

-- Test 1: Execute sp_get_paper_review_summary for Paper 1
CALL sp_get_paper_review_summary(1);

-- Test 2: Execute sp_get_author_portfolio for Author 2 (Dr. Ada Lovelace)
CALL sp_get_author_portfolio(2);

-- Test 3: Test sp_submit_paper transactional procedure
SET @new_id = 0;
CALL sp_submit_paper(
    1, 
    'Quantum Annealing Benchmarks on Combinatorial Graph Partitioning', 
    'Empirical evaluation of quantum annealing hardware vs classical simulated annealing.',
    'quantum computing, annealing, optimization, graph algorithms',
    'https://proe-archive.org/papers/2026/quantum-annealing-graphs.pdf',
    @new_id
);

-- Inspect generated paper ID
SELECT @new_id AS newly_created_paper_id;

-- Cleanup the test paper created by Test 3
DELETE FROM papers WHERE paper_id = @new_id;
