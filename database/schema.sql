-- =============================================================================
-- PROE (Peer Review Orchestration Engine) - Relational Schema DDL
-- Component: Person 3 (Database Architecture & DBMS Evaluation)
-- RDBMS Target: MySQL 8.0+ (InnoDB Storage Engine)
-- =============================================================================

-- 1. Database Creation & Charset Specification
CREATE DATABASE IF NOT EXISTS proe_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE proe_db;

-- 2. Clean teardown in reverse dependency order (safe script execution)
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS papers;
DROP TABLE IF EXISTS users;

-- -----------------------------------------------------------------------------
-- 3. Table: users
-- Represents registered academic users who can act as authors, reviewers, or both.
-- Satisfies 3NF: All attributes depend strictly and directly on user_id (and email).
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    user_id INT UNSIGNED AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary and Unique Candidate Keys
    CONSTRAINT pk_users PRIMARY KEY (user_id),
    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 4. Table: papers
-- Represents research papers submitted by an author.
-- 1:M relationship with users (one user authors many papers).
-- -----------------------------------------------------------------------------
CREATE TABLE papers (
    paper_id INT UNSIGNED AUTO_INCREMENT,
    author_id INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    abstract TEXT NOT NULL,
    keywords VARCHAR(255) NOT NULL,
    paper_url VARCHAR(500) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary Key
    CONSTRAINT pk_papers PRIMARY KEY (paper_id),
    
    -- Foreign Key referencing users with cascade delete
    CONSTRAINT fk_papers_author FOREIGN KEY (author_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 5. Table: reviews
-- Represents peer reviews submitted for a manuscript.
-- 1:M relationship with papers and 1:M relationship with users (reviewers).
-- Enforces:
--   - rating range 1 to 5
--   - editorial recommendation ENUM ('ACCEPT', 'REVISE', 'REJECT')
--   - a reviewer can review a specific paper at most once
-- -----------------------------------------------------------------------------
CREATE TABLE reviews (
    review_id INT UNSIGNED AUTO_INCREMENT,
    paper_id INT UNSIGNED NOT NULL,
    reviewer_id INT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    comments TEXT NOT NULL,
    recommendation ENUM('ACCEPT', 'REVISE', 'REJECT') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary Key
    CONSTRAINT pk_reviews PRIMARY KEY (review_id),
    
    -- Foreign Keys
    CONSTRAINT fk_reviews_paper FOREIGN KEY (paper_id)
        REFERENCES papers (paper_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
        
    CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_id)
        REFERENCES users (user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
        
    -- Check Constraint on rating range
    CONSTRAINT chk_reviews_rating CHECK (rating >= 1 AND rating <= 5),
    
    -- Business rule: One review per reviewer per paper
    CONSTRAINT uk_paper_reviewer UNIQUE (paper_id, reviewer_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 6. Table: audit_logs
-- Immutable transaction audit trail populated by MySQL Triggers.
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    log_id INT UNSIGNED AUTO_INCREMENT,
    table_name VARCHAR(50) NOT NULL,
    action_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    record_id INT UNSIGNED NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_audit_logs PRIMARY KEY (log_id)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- 7. Performance B-Tree Indexes
-- Optimizes common join queries, foreign key lookups, and chronological feeds.
-- -----------------------------------------------------------------------------
CREATE INDEX idx_papers_author ON papers (author_id);
CREATE INDEX idx_papers_created_at ON papers (created_at DESC);
CREATE INDEX idx_reviews_paper ON reviews (paper_id);
CREATE INDEX idx_reviews_reviewer ON reviews (reviewer_id);
CREATE INDEX idx_audit_table_date ON audit_logs (table_name, created_at DESC);
