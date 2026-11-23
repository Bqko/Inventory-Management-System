const fs = require('fs');
const path = require('path');
const db = require('./db');

const schemaPath = process.env.SCHEMA_PATH || path.join(__dirname, '..', '..', 'schema.sql');
db.exec(fs.readFileSync(schemaPath, 'utf8'));
console.log('Database schema applied from', schemaPath);
