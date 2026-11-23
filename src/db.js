require('dotenv').config();
const path = require('path');
// Built into Node 22.13+ (no install or compiling needed).
const { DatabaseSync } = require('node:sqlite');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'inventory.db');
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON');

module.exports = db;
