const test = require("node:test");
const assert = require("node:assert/strict");

test("activity service package has the expected scripts", () => {
  const pkg = require("../package.json");
  assert.equal(pkg.scripts.start, "node server.js");
  assert.ok(pkg.scripts.check.includes("node --check"));
});

test("activity event types include required core actions", () => {
  const fs = require("node:fs");
  const source = fs.readFileSync(require("node:path").join(__dirname, "../routes/activity.js"), "utf8");
  assert.match(source, /PAPER_SUBMITTED/);
  assert.match(source, /REVIEW_SUBMITTED/);
  assert.match(source, /\/summary/);
});
