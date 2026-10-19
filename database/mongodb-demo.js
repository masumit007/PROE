// =============================================================================
// PROE (Peer Review Orchestration Engine) - MongoDB & NoSQL Syllabus Suite
// Component: Person 3 (Database Architecture & DBMS Evaluation)
// Syllabus Module: Full Stack Unit 4 / DBMS NoSQL Coverage (Day 5)
// Usage: Run directly in the MongoDB Shell (mongosh) or via Node.js
// =============================================================================

/*
================================================================================
SECTION 1: Theoretical Foundation — SQL vs. NoSQL Comparison
================================================================================
| Feature / Dimension        | Relational DBMS (MySQL)             | Document Store (MongoDB)          |
|----------------------------|-------------------------------------|-----------------------------------|
| Data Model                 | Tables, rows, columns, foreign keys | Collections of flexible BSON docs|
| Schema Definition          | Rigid, schema-on-write (DDL)        | Flexible, dynamic schema-on-read  |
| Transaction Guarantees     | Full ACID by default (InnoDB)       | ACID at single-document level     |
| Joins vs. Embedding        | Normalized tables linked by JOINs   | Embedded subdocs or references    |
| Scaling Strategy           | Vertical scaling (scale up)         | Horizontal sharding (scale out)   |
| Primary PROE Use Case      | Core transactional users, papers    | Append-only event logs, analytics |
================================================================================
*/


// =============================================================================
// SECTION 2: Database Lifecycle Management (Shell commands)
// =============================================================================

// 2.1 Switch to / create practice database
// Shell equivalent: use proe_nosql_db;
const dbName = "proe_nosql_db";
print(`[Step 1] Initializing and switching to database: ${dbName}`);

// 2.2 Drop practice database if exists to ensure clean repeatable runs
// Shell equivalent: db.dropDatabase();
db.dropDatabase();
print(`[Step 2] Clean teardown complete. Ready for fresh execution.`);


// =============================================================================
// SECTION 3: CRUD Operations on activity_events Collection
// =============================================================================

print("\n--- SECTION 3: CRUD Operations Demonstration ---");

// 3.1 CREATE (insertOne & insertMany)
// Insert a single paper submission event
const singleInsertResult = db.activity_events.insertOne({
    eventType: "PAPER_SUBMITTED",
    userId: 1,
    paperId: 1,
    metadata: {
        title: "Machine Learning Approaches to Byzantine Fault Tolerance",
        authorEmail: "turing@oxford.ac.uk"
    },
    timestamp: new Date("2026-09-15T10:00:00Z")
});
print(`[CREATE] insertOne inserted ID: ${singleInsertResult.insertedId}`);

// Batch insert multiple activity events
const batchInsertResult = db.activity_events.insertMany([
    {
        eventType: "REVIEW_SUBMITTED",
        userId: 2,
        paperId: 1,
        metadata: { rating: 5, recommendation: "ACCEPT" },
        timestamp: new Date("2026-09-16T14:00:00Z")
    },
    {
        eventType: "REVIEW_SUBMITTED",
        userId: 3,
        paperId: 1,
        metadata: { rating: 4, recommendation: "ACCEPT" },
        timestamp: new Date("2026-09-17T09:30:00Z")
    },
    {
        eventType: "PAPER_SUBMITTED",
        userId: 2,
        paperId: 2,
        metadata: { title: "Optimizing Query Execution Plans Using Adaptive GNNs" },
        timestamp: new Date("2026-09-18T12:30:00Z")
    },
    {
        eventType: "USER_LOGIN",
        userId: 4,
        metadata: { clientIp: "192.168.1.105", userAgent: "Mozilla/5.0" },
        timestamp: new Date("2026-09-20T08:00:00Z")
    },
    {
        eventType: "REVIEW_SUBMITTED",
        userId: 1,
        paperId: 2,
        metadata: { rating: 4, recommendation: "ACCEPT" },
        timestamp: new Date("2026-09-20T11:00:00Z")
    }
]);
print(`[CREATE] insertMany inserted count: ${Object.keys(batchInsertResult.insertedIds).length}`);

// 3.2 READ (find with filter and projection)
print("\n[READ] Querying all REVIEW_SUBMITTED events (projecting eventType, userId, timestamp):");
const reviewsCursor = db.activity_events.find(
    { eventType: "REVIEW_SUBMITTED" },
    { _id: 0, eventType: 1, userId: 1, "metadata.rating": 1, timestamp: 1 }
);
reviewsCursor.forEach(doc => printjson(doc));

// 3.3 UPDATE (updateOne with $set)
print("\n[UPDATE] Updating metadata for a specific event:");
const updateResult = db.activity_events.updateOne(
    { eventType: "USER_LOGIN", userId: 4 },
    { $set: { "metadata.authMethod": "BCRYPT_PASSWORD", verifiedSession: true } }
);
print(`[UPDATE] Modified count: ${updateResult.modifiedCount}`);

// 3.4 DELETE (deleteOne)
print("\n[DELETE] Removing transient login event:");
const deleteResult = db.activity_events.deleteOne({ eventType: "USER_LOGIN" });
print(`[DELETE] Deleted count: ${deleteResult.deletedCount}`);


// =============================================================================
// SECTION 4: Data Modeling Demonstration (1:1 & M:N Relationships)
// =============================================================================

print("\n--- SECTION 4: Data Modeling Demonstration ---");

// 4.1 One-to-One (1:1) Embedded Document Pattern
// Embedding researcher profile & credentials directly into the researcher document
db.researchers_profile.insertOne({
    userId: 1,
    name: "Dr. Alan Turing",
    email: "turing@oxford.ac.uk",
    profile: {
        department: "Computer Science & Artificial Intelligence",
        institution: "University of Oxford",
        orcidId: "0000-0002-1825-0097",
        hIndex: 58,
        bio: "Pioneer of theoretical computer science and cryptographic analysis."
    }
});
print("[1:1 Modeling] Embedded researcher profile document inserted.");

// 4.2 Many-to-Many (M:N) Document Reference Pattern
// Research categories (taxonomy) referenced by manuscripts via array of category codes
db.categories.insertMany([
    { _id: "CAT_DIST_SYS", name: "Distributed Systems & Consensus" },
    { _id: "CAT_ML_DBMS",  name: "Machine Learning for Database Systems" },
    { _id: "CAT_CRYPTO",   name: "Post-Quantum Cryptography" }
]);

db.manuscript_categories.insertOne({
    paperId: 1,
    title: "Machine Learning Approaches to Byzantine Fault Tolerance",
    categoryIds: ["CAT_DIST_SYS", "CAT_ML_DBMS"], // Array of references (M:N mapping)
    primaryTag: "CAT_DIST_SYS"
});
print("[M:N Modeling] Categories and manuscript reference array inserted.");


// =============================================================================
// SECTION 5: Aggregation Pipeline (Multistage Analysis)
// =============================================================================

print("\n--- SECTION 5: Aggregation Pipeline Demonstration ---");

// Pipeline 1: Calculate total occurrences of each eventType, sorted descending
print("[Aggregation 1] Event Type Volume Breakdown ($group, $sort, $project):");
const eventStats = db.activity_events.aggregate([
    { 
        $match: { timestamp: { $gte: new Date("2026-09-01T00:00:00Z") } } 
    },
    {
        $group: {
            _id: "$eventType",
            totalOccurrences: { $sum: 1 },
            uniqueUsers: { $addToSet: "$userId" }
        }
    },
    {
        $project: {
            _id: 0,
            eventType: "$_id",
            totalOccurrences: 1,
            userCount: { $size: "$uniqueUsers" }
        }
    },
    {
        $sort: { totalOccurrences: -1 }
    }
]);
eventStats.forEach(doc => printjson(doc));


// =============================================================================
// SECTION 6: Index Creation & Performance Analysis
// =============================================================================

print("\n--- SECTION 6: Index Creation & Analysis ---");

// 6.1 Create single-field descending index on timestamp
const singleIndex = db.activity_events.createIndex({ timestamp: -1 });
print(`[Index Created] Single field index: ${singleIndex}`);

// 6.2 Create compound index on eventType and userId for fast filtered lookups
const compoundIndex = db.activity_events.createIndex({ eventType: 1, userId: 1 });
print(`[Index Created] Compound index: ${compoundIndex}`);

// 6.3 Verify index list on collection
print("[Indexes on activity_events]:");
printjson(db.activity_events.getIndexes());


// =============================================================================
// SECTION 7: MongoDB Atlas Cloud Connection Helper (Person 4 Coordination)
// =============================================================================

/*
To connect to MongoDB Atlas cloud cluster:
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI || "mongodb+srv://<username>:<password>@cluster0.proe.mongodb.net/proe_nosql_db?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function runAtlasCheck() {
    try {
        await client.connect();
        const database = client.db("proe_nosql_db");
        const count = await database.collection("activity_events").countDocuments();
        console.log(`Connected to MongoDB Atlas! Total activity documents: ${count}`);
    } finally {
        await client.close();
    }
}
*/

print("\n=============================================================================");
print("MongoDB & NoSQL Syllabus Suite Execution Completed Successfully!");
print("=============================================================================");
