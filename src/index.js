require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET. Copy .env.example to .env and set it.');
  process.exit(1);
}

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// Developer test page: http://localhost:4000  (delete the "public" folder and this line before submitting)
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/demo', require('./routes/demo')); // remove later

// Member B: add your routes here and protect them, for example:
// const { authenticate, requireRole } = require('./middleware/auth');
// app.use('/api/products', authenticate, require('./routes/products'));
// and inside: router.delete('/:id', requireRole('manager', 'admin'), ...)

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log('Server running on http://localhost:' + port));
