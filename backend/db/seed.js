require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./index');

const users = [
  ['Ada Admin',    'admin@example.com',   'Admin123!',   'admin'],
  ['Mark Manager', 'manager@example.com', 'Manager123!', 'manager'],
  ['Sara Staff',   'staff@example.com',   'Staff123!',   'staff'],
];

const categories = ['Fasteners', 'Power Tools', 'Safety Gear', 'Electrical', 'Packaging'];

const suppliers = [
  ['Kavkaz Hardware Supply', 'orders@kavkazhw.example',  '+995 32 200 11 22', 'Tbilisi, Industrial St. 14'],
  ['Elektro Trade Ltd',      'sales@elektrotrade.example', '+995 32 211 33 44', 'Tbilisi, Rustavi Hwy 3'],
  ['SafeWork Georgia',       'info@safework.example',    '+995 32 255 66 77', 'Kutaisi, Tsereteli Ave 21'],
  ['PackLine Co.',           'hello@packline.example',   '+995 32 244 88 99', 'Rustavi, Zone B, Unit 7'],
];

// [sku, name, quantity, min_level, price, category, supplier]
const products = [
  ['FST-0101', 'Hex bolt M8x40, zinc (box of 100)',   64, 20,  12.50, 'Fasteners',   'Kavkaz Hardware Supply'],
  ['FST-0102', 'Wood screw 4x50 (box of 200)',        12, 25,   9.80, 'Fasteners',   'Kavkaz Hardware Supply'],
  ['FST-0107', 'Anchor bolt M12x120',                 40, 15,   1.90, 'Fasteners',   'Kavkaz Hardware Supply'],
  ['PWT-0201', 'Cordless drill 18V',                   9,  5, 189.00, 'Power Tools', 'Kavkaz Hardware Supply'],
  ['PWT-0214', 'Angle grinder 125mm, 900W',            3,  4, 112.00, 'Power Tools', 'Kavkaz Hardware Supply'],
  ['SAF-0301', 'Safety helmet, yellow',               35, 20,  14.00, 'Safety Gear', 'SafeWork Georgia'],
  ['SAF-0305', 'Work gloves, size L (pair)',           8, 30,   4.20, 'Safety Gear', 'SafeWork Georgia'],
  ['SAF-0312', 'Safety goggles, clear',               52, 20,   3.60, 'Safety Gear', 'SafeWork Georgia'],
  ['ELE-0401', 'Extension cable 5m, 3x1.5mm',         18, 10,  16.50, 'Electrical',  'Elektro Trade Ltd'],
  ['ELE-0408', 'LED bulb E27 10W (carton of 20)',     26,  8,  38.00, 'Electrical',  'Elektro Trade Ltd'],
  ['PKG-0501', 'Stretch film 500mm, 3kg roll',        44, 15,   7.40, 'Packaging',   'PackLine Co.'],
  ['PKG-0507', 'Cardboard box 40x30x30 (bundle of 25)', 0, 10, 21.00, 'Packaging',   'PackLine Co.'],
];

const seed = db.transaction(() => {
  // wipe in FK-safe order
  db.exec(`
    DELETE FROM stock_movements;
    DELETE FROM products;
    DELETE FROM suppliers;
    DELETE FROM categories;
    DELETE FROM users;
    DELETE FROM sqlite_sequence;
  `);

  const insUser = db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  );
  for (const [name, email, pw, role] of users) {
    insUser.run(name, email, bcrypt.hashSync(pw, 10), role);
  }

  const insCat = db.prepare('INSERT INTO categories (name) VALUES (?)');
  const catId = {};
  for (const c of categories) catId[c] = insCat.run(c).lastInsertRowid;

  const insSup = db.prepare(
    'INSERT INTO suppliers (name, email, phone, address) VALUES (?, ?, ?, ?)'
  );
  const supId = {};
  for (const s of suppliers) supId[s[0]] = insSup.run(...s).lastInsertRowid;

  const insProd = db.prepare(`
    INSERT INTO products (sku, name, quantity, min_level, price, category_id, supplier_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const prodId = {};
  for (const [sku, name, qty, min, price, cat, sup] of products) {
    prodId[sku] = insProd.run(sku, name, qty, min, price, catId[cat], supId[sup]).lastInsertRowid;
  }

  // a little history so the admin movement view isn't empty (user 2 = manager, 3 = staff)
  const insMov = db.prepare(`
    INSERT INTO stock_movements (product_id, user_id, type, amount, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?)`);
  const history = [
    ['FST-0101', 2, 'IN',  100, 'Delivery from Kavkaz Hardware', '2026-11-16 09:12:00'],
    ['FST-0101', 3, 'OUT',  36, 'Site A, foundation work',       '2026-11-17 14:30:00'],
    ['SAF-0305', 3, 'OUT',  22, 'Issued to night crew',          '2026-11-18 08:05:00'],
    ['PWT-0214', 2, 'IN',    5, 'Replacement stock',             '2026-11-19 10:40:00'],
    ['PWT-0214', 3, 'OUT',   2, 'Workshop request #118',         '2026-11-20 16:15:00'],
    ['PKG-0507', 3, 'OUT',  30, 'Outbound shipment batch 42',    '2026-11-21 11:00:00'],
  ];
  for (const [sku, uid, type, amt, note, at] of history) {
    insMov.run(prodId[sku], uid, type, amt, note, at);
  }
});

seed();
console.log('Seed complete. Test accounts:');
users.forEach(([, email, pw, role]) => console.log(`  ${role.padEnd(8)} ${email}  /  ${pw}`));