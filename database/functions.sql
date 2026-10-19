-- =============================================================================
-- PROE (Peer Review Orchestration Engine) - Stored Functions (UDFs)
-- Component: Person 3 (Database Architecture & DBMS Evaluation)
-- RDBMS Target: MySQL 8.0+
-- =============================================================================

USE proe_db;

DROP FUNCTION IF EXISTS fn_calculate_avg_rating;
DROP FUNCTION IF EXISTS fn_get_editorial_verdict;

DELIMITER //

-- -----------------------------------------------------------------------------
-- FUNCTION 1: fn_calculate_avg_rating
-- Purpose: Computes and returns the arithmetic mean rating for a given paper.
-- Parameters:
--   - p_paper_id (INT UNSIGNED): Primary key of the paper
-- Returns:
--   - DECIMAL(3, 2): Average rating (e.g., 4.33). Returns 0.00 if no reviews exist.
-- Characteristics: READS SQL DATA
-- -----------------------------------------------------------------------------
CREATE FUNCTION fn_calculate_avg_rating (
    p_paper_id INT UNSIGNED
)
RETURNS DECIMAL(3, 2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_avg_rating DECIMAL(3, 2);

    SELECT COALESCE(AVG(rating), 0.00)
    INTO v_avg_rating
    FROM reviews
    WHERE paper_id = p_paper_id;

    RETURN v_avg_rating;
END //

-- -----------------------------------------------------------------------------
-- FUNCTION 2: fn_get_editorial_verdict
-- Purpose: Evaluates paper status based on average score and review threshold.
-- Business Logic:
--   - Reviews < 2                 -> 'UNDER REVIEW'
--   - Avg Rating >= 4.0           -> 'ACCEPTED'
--   - Avg Rating BETWEEN 2.5, 3.99 -> 'REVISION NEEDED'
--   - Avg Rating < 2.5            -> 'REJECTED'
-- Parameters:
--   - p_paper_id (INT UNSIGNED): Primary key of the paper
-- Returns:
--   - VARCHAR(25): Editorial verdict
-- Characteristics: READS SQL DATA
-- -----------------------------------------------------------------------------
CREATE FUNCTION fn_get_editorial_verdict (
    p_paper_id INT UNSIGNED
)
RETURNS VARCHAR(25)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_review_count INT DEFAULT 0;
    DECLARE v_avg_rating DECIMAL(3, 2) DEFAULT 0.00;
    DECLARE v_verdict VARCHAR(25);

    -- Fetch count and average score for the given paper
    SELECT COUNT(review_id), COALESCE(AVG(rating), 0.00)
    INTO v_review_count, v_avg_rating
    FROM reviews
    WHERE paper_id = p_paper_id;

    -- Apply consensus rules
    IF v_review_count < 2 THEN
        SET v_verdict = 'UNDER REVIEW';
    ELSEIF v_avg_rating >= 4.00 THEN
        SET v_verdict = 'ACCEPTED';
    ELSEIF v_avg_rating >= 2.50 THEN
        SET v_verdict = 'REVISION NEEDED';
    ELSE
        SET v_verdict = 'REJECTED';
    END IF;

    RETURN v_verdict;
END //

DELIMITER ;


-- =============================================================================
-- VERIFICATION & DEMONSTRATION TESTS (DBMS Evaluation Rubric Proof)
-- =============================================================================

-- Test 1: Invoke fn_calculate_avg_rating on each paper
SELECT 
    p.paper_id,
    p.title,
    fn_calculate_avg_rating(p.paper_id) AS computed_avg_rating
FROM papers p;

-- Test 2: Invoke fn_get_editorial_verdict across all papers in the catalog
SELECT 
    p.paper_id,
    p.title,
    fn_calculate_avg_rating(p.paper_id) AS avg_rating,
    fn_get_editorial_verdict(p.paper_id) AS editorial_verdict
FROM papers p;
