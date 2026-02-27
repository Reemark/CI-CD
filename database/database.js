const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");
const logger = require("../logger");

const DEFAULT_DB_PATH = path.join(__dirname, "..", "todo.db");

let db;

function getDbPath() {
  return process.env.TODO_DB_PATH || DEFAULT_DB_PATH;
}

async function getDb() {
  if (db) return db;
  logger.info("Initializing database connection");
  const SQL = await initSqlJs();
  const dbPath = getDbPath();

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending'
    )
  `);
  return db;
}

function saveDb() {
  if (db) {
    logger.info({ dbPath: getDbPath() }, "Saving database to disk");
    const dbPath = getDbPath();
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
}

function resetDb() {
  if (db && typeof db.close === "function") {
    db.close();
  }
  db = undefined;
}

module.exports = { getDb, saveDb, resetDb };
