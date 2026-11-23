const bcrypt = require('bcryptjs');
const db = require('./db');

const users = [
  { name: 'Ada Admin', email: 'admin@example.com', password: 'Admin123!', role: 'admin' },
  { name: 'Mark Manager', email: 'manager@example.com', password: 'Manager123!', role: 'manager' },
  { name: 'Sara Staff', email: 'staff@example.com', password: 'Staff123!', role: 'staff' },
];

async function main() {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  );
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    const info = insert.run(u.name, u.email, hash, u.role);
    console.log(info.changes ? 'Created' : 'Already exists', u.email, '(' + u.role + ')');
  }
}

main();
