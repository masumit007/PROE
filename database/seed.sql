-- =============================================================================
-- PROE (Peer Review Orchestration Engine) - Realistic Seed Data
-- Component: Person 3 (Database Architecture & DBMS Evaluation)
-- RDBMS Target: MySQL 8.0+
-- =============================================================================

USE proe_db;

-- 1. Disable foreign key checks for clean batch reset
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE reviews;
TRUNCATE TABLE papers;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 2. Seed Users
-- Passwords hashed with BCrypt (plain equivalent: 'Password@123')
-- -----------------------------------------------------------------------------
INSERT INTO users (user_id, name, email, password_hash, created_at) VALUES
(1, 'Dr. Alan Turing', 'turing@oxford.ac.uk', '$2a$12$e8p2H1g.d.YlA0C7sZtIiu6K7kL7m7yU8eN8yR7wB8kP4qL2eG7qW', '2026-09-01 09:00:00'),
(2, 'Dr. Ada Lovelace', 'lovelace@cambridge.ac.uk', '$2a$12$e8p2H1g.d.YlA0C7sZtIiu6K7kL7m7yU8eN8yR7wB8kP4qL2eG7qW', '2026-09-02 10:15:00'),
(3, 'Dr. Claude Shannon', 'shannon@mit.edu', '$2a$12$e8p2H1g.d.YlA0C7sZtIiu6K7kL7m7yU8eN8yR7wB8kP4qL2eG7qW', '2026-09-03 11:30:00'),
(4, 'Dr. Barbara Liskov', 'liskov@stanford.edu', '$2a$12$e8p2H1g.d.YlA0C7sZtIiu6K7kL7m7yU8eN8yR7wB8kP4qL2eG7qW', '2026-09-05 14:00:00'),
(5, 'Dr. Leslie Lamport', 'lamport@berkeley.edu', '$2a$12$e8p2H1g.d.YlA0C7sZtIiu6K7kL7m7yU8eN8yR7wB8kP4qL2eG7qW', '2026-09-07 16:45:00'),
(6, 'Dr. Grace Hopper', 'hopper@yale.edu', '$2a$12$e8p2H1g.d.YlA0C7sZtIiu6K7kL7m7yU8eN8yR7wB8kP4qL2eG7qW', '2026-09-10 08:30:00');

-- -----------------------------------------------------------------------------
-- 3. Seed Research Papers
-- Realistic Computer Science & DBMS academic publications
-- -----------------------------------------------------------------------------
INSERT INTO papers (paper_id, author_id, title, abstract, keywords, paper_url, created_at) VALUES
(1, 1, 
 'Machine Learning Approaches to Byzantine Fault Tolerance in Decentralized Ledger Systems',
 'This paper proposes an adaptive consensus protocol leveraging reinforcement learning to detect and mitigate malicious node behavior in permissionless peer-to-peer networks. Empirical evaluations demonstrate a 34% reduction in consensus latency under adversarial conditions.',
 'distributed systems, consensus, blockchain, byzantine fault tolerance, machine learning',
 'https://proe-archive.org/papers/2026/byzantine-ml-consensus.pdf',
 '2026-09-15 10:00:00'),

(2, 2, 
 'Optimizing Relational Query Execution Plans Using Adaptive Graph Neural Networks',
 'Traditional cost-based query optimizers suffer from severe cardinal estimation errors on complex multi-table joins. We formulate SQL query graphs as heterogeneous graph embeddings and predict optimal physical operators with 92% plan accuracy on TPC-H benchmarks.',
 'database systems, query optimization, machine learning, graph neural networks, sql',
 'https://proe-archive.org/papers/2026/gnn-query-optimization.pdf',
 '2026-09-18 12:30:00'),

(3, 3, 
 'Information-Theoretic Security Boundaries in Post-Quantum Lattice-Based Cryptography',
 'We examine the entropy leakage and asymptotic security proofs of learning-with-errors (LWE) lattice primitives against hybrid quantum-classical adversaries. Our results establish new lower bounds for key exchange protocol parameter selection.',
 'cryptography, post-quantum, information theory, quantum computing, lattice cryptography',
 'https://proe-archive.org/papers/2026/post-quantum-lattice-entropy.pdf',
 '2026-09-22 15:20:00'),

(4, 4, 
 'Formal Verification of Multi-Version Concurrency Control (MVCC) in Distributed Cloud DBMS',
 'Multi-Version Concurrency Control under Snapshot Isolation often encounters subtle write-skew anomalies in distributed environments. We provide a mechanized TLA+ specification and machine-checked proof of serializability for a novel hybrid logical clock engine.',
 'concurrency control, mvcc, formal verification, cloud databases, snapshot isolation',
 'https://proe-archive.org/papers/2026/mvcc-formal-verification.pdf',
 '2026-09-25 11:10:00'),

(5, 5, 
 'Paxos Versus Raft: An Empirical Latency and Network Overhead Evaluation in Geo-Replicated Clusters',
 'While Paxos and Raft are theoretically equivalent in leader-driven state machine replication, their operational performance differs substantially across high-jitter WAN links. We benchmark throughput and failover recovery across five global AWS regions.',
 'consensus protocols, paxos, raft, latency analysis, cloud infrastructure, geo-replication',
 'https://proe-archive.org/papers/2026/paxos-vs-raft-wan-benchmarks.pdf',
 '2026-09-28 17:00:00');

-- -----------------------------------------------------------------------------
-- 4. Seed Peer Reviews
-- Realistic evaluations ensuring author_id != reviewer_id
-- Diverse ratings (1-5) and recommendation decisions
-- -----------------------------------------------------------------------------
INSERT INTO reviews (review_id, paper_id, reviewer_id, rating, comments, recommendation, created_at) VALUES
-- Reviews for Paper 1 (Author: Alan Turing / ID: 1)
(1, 1, 2, 5, 
 'Exceptional manuscript with rigorous mathematical formalization. The simulation results clearly demonstrate practical latency reduction in the presence of 30% malicious nodes. Highly recommended for acceptance.', 
 'ACCEPT', '2026-09-16 14:00:00'),

(2, 1, 3, 4, 
 'The core thesis is well-argued and supported by empirical benchmarks. However, the author should elaborate on the training overhead of the RL agent during abrupt topology changes in Section 4.3.', 
 'ACCEPT', '2026-09-17 09:30:00'),

(3, 1, 4, 3, 
 'Interesting premise, but the threat model relies on slightly optimistic synchronous network assumptions during wide-scale network partitions. A revision addressing partial synchrony is needed.', 
 'REVISE', '2026-09-19 16:15:00'),

-- Reviews for Paper 2 (Author: Ada Lovelace / ID: 2)
(4, 2, 1, 4, 
 'Novel formulation of relational query trees as heterogeneous graph structures. Join order predictions show substantial speedups over standard PostgreSQL cost models. Accept with minor clarifications on inference latency.', 
 'ACCEPT', '2026-09-20 11:00:00'),

(5, 2, 5, 2, 
 'While the theoretical idea is compelling, the inference overhead of the neural network during query compilation exceeds the runtime benefit for simple OLTP queries. The author must benchmark against realistic hybrid workloads.', 
 'REVISE', '2026-09-21 15:45:00'),

-- Reviews for Paper 3 (Author: Claude Shannon / ID: 3)
(6, 3, 4, 5, 
 'Foundational theoretical contribution. The entropy bounding proofs are airtight and provide concrete parameter guidance for standardized post-quantum cryptosystems. Definite accept.', 
 'ACCEPT', '2026-09-24 10:20:00'),

(7, 3, 6, 4, 
 'Very well-written paper that bridges abstract information theory with practical lattice cryptanalysis. Clear notation and rigorous lemmas throughout.', 
 'ACCEPT', '2026-09-26 13:40:00'),

-- Reviews for Paper 4 (Author: Barbara Liskov / ID: 4)
(8, 4, 2, 5, 
 'Outstanding formal treatment of Snapshot Isolation. The TLA+ model checking confirms the complete absence of write-skew anomalies under the proposed hybrid timestamp ordering.', 
 'ACCEPT', '2026-09-27 12:00:00'),

(9, 4, 3, 5, 
 'Impeccable academic quality. The intersection of formal methods and cloud database transactions is rarely handled with such clarity and mathematical rigor.', 
 'ACCEPT', '2026-09-28 14:50:00'),

-- Reviews for Paper 5 (Author: Leslie Lamport / ID: 5)
(10, 5, 1, 3, 
 'The multi-region AWS evaluation is thorough and practical. However, testing under synthetic packet loss and asymmetric network partitions would significantly strengthen the comparison between Paxos and Multi-Raft.', 
 'REVISE', '2026-09-29 09:10:00'),

(11, 5, 6, 1, 
 'The benchmarking methodology does not sufficiently isolate CPU contention from WAN network jitter. Furthermore, the conclusions rehash existing consensus trade-offs without presenting novel optimizations.', 
 'REJECT', '2026-09-30 16:30:00');

-- -----------------------------------------------------------------------------
-- 5. Seed Initial Audit Log Record
-- -----------------------------------------------------------------------------
INSERT INTO audit_logs (table_name, action_type, record_id, description, created_at) VALUES
('users', 'INSERT', 1, 'System initialization: seeded research faculty users and baseline manuscripts.', '2026-10-01 00:00:00');
