-- =============================================================================
-- PROE (Peer Review Orchestration Engine) - Database Triggers
-- Component: Person 3 (Database Architecture & DBMS Evaluation)
-- RDBMS Target: MySQL 8.0+
-- =============================================================================

USE proe_db;

DROP TRIGGER IF EXISTS trg_before_review_insert;
DROP TRIGGER IF EXISTS trg_after_paper_insert;
DROP TRIGGER IF EXISTS trg_after_review_insert;

DELIMITER //

-- -----------------------------------------------------------------------------
-- TRIGGER 1: trg_before_review_insert (Integrity Constraint Enforcement)
-- Purpose: Prevents conflict of interest by ensuring an author CANNOT review
--          their own research paper.
-- Event: BEFORE INSERT ON reviews
-- -----------------------------------------------------------------------------
CREATE TRIGGER trg_before_review_insert
BEFORE INSERT ON reviews
FOR EACH ROW
BEGIN
    DECLARE v_author_id INT UNSIGNED;

    -- Retrieve the author of the target manuscript
    SELECT author_id INTO v_author_id
    FROM papers
    WHERE paper_id = NEW.paper_id;

    -- Enforce conflict-of-interest business rule
    IF NEW.reviewer_id = v_author_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Integrity Violation: Conflict of interest! An author cannot review their own manuscript.';
    END IF;
END //

-- -----------------------------------------------------------------------------
-- TRIGGER 2: trg_after_paper_insert (Automated Transaction Auditing)
-- Purpose: Automatically logs an immutable transaction record into audit_logs
--          whenever a new research manuscript is submitted.
-- Event: AFTER INSERT ON papers
-- -----------------------------------------------------------------------------
CREATE TRIGGER trg_after_paper_insert
AFTER INSERT ON papers
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (table_name, action_type, record_id, description, created_at)
    VALUES (
        'papers',
        'INSERT',
        NEW.paper_id,
        CONCAT('New paper submitted: "', LEFT(NEW.title, 50), '..." by Author ID: ', NEW.author_id),
        NOW()
    );
END //

-- -----------------------------------------------------------------------------
-- TRIGGER 3: trg_after_review_insert (Automated Review Auditing)
-- Purpose: Records review submissions in audit_logs, preserving quantitative score
--          and recommendation decision for audit verification.
-- Event: AFTER INSERT ON reviews
-- -----------------------------------------------------------------------------
CREATE TRIGGER trg_after_review_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (table_name, action_type, record_id, description, created_at)
    VALUES (
        'reviews',
        'INSERT',
        NEW.review_id,
        CONCAT('Review submitted for Paper ID: ', NEW.paper_id, ' by Reviewer ID: ', NEW.reviewer_id, ' [Rating: ', NEW.rating, '/5, Decision: ', NEW.recommendation, ']'),
        NOW()
    );
END //

DELIMITER ;


-- =============================================================================
-- VERIFICATION & DEMONSTRATION TESTS (DBMS Evaluation Rubric Proof)
-- =============================================================================

-- Demonstration 1: Verify trg_after_paper_insert by inserting a test paper
INSERT INTO papers (author_id, title, abstract, keywords, paper_url)
VALUES (
    3, 
    'Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge (zk-SNARKs) in Cloud Auditing', 
    'An implementation and formal verification of recursive zk-SNARK circuits for cloud data provenance.',
    'cryptography, zk-snarks, zero knowledge, cloud security',
    'https://proe-archive.org/papers/2026/zksnarks-cloud.pdf'
);
SET @test_paper_id = LAST_INSERT_ID();

-- Check that audit_logs received the automated entry from the trigger
SELECT * FROM audit_logs WHERE table_name = 'papers' ORDER BY log_id DESC LIMIT 1;


-- Demonstration 2: Verify trg_after_review_insert by submitting a legitimate review
-- (Reviewer 2 reviewing Paper 3 authored by Dr. Claude Shannon)
INSERT INTO reviews (paper_id, reviewer_id, rating, comments, recommendation)
VALUES (
    @test_paper_id,
    2,
    5,
    'Brilliant circuit construction. Gas costs on EVM testbeds are significantly lower than existing designs.',
    'ACCEPT'
);
SET @test_review_id = LAST_INSERT_ID();

-- Check that audit_logs recorded the review event
SELECT * FROM audit_logs WHERE table_name = 'reviews' ORDER BY log_id DESC LIMIT 1;


-- Demonstration 3: Verify trg_before_review_insert (Expected to FAIL)
-- Attempting author self-review: Author 3 attempting to review their own paper (@test_paper_id)
-- UNCOMMENT TO TEST ERROR TRIGGER:
-- INSERT INTO reviews (paper_id, reviewer_id, rating, comments, recommendation)
-- VALUES (@test_paper_id, 3, 5, 'My paper is excellent.', 'ACCEPT');
-- Expected Result: Error 1644 (45000): Integrity Violation: Conflict of interest! An author cannot review their own manuscript.


-- Clean up test records
DELETE FROM reviews WHERE review_id = @test_review_id;
DELETE FROM papers WHERE paper_id = @test_paper_id;
