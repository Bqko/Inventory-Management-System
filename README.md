# Inventory Management System

Web Programming, Ilia State University, Fall 2026. Team 11.

A web app for tracking products, suppliers and stock levels. Staff record stock in and stock out, managers maintain products and suppliers, and admins see the full movement history and manage user roles. Products below their minimum level appear in a low-stock list.

**Team:** Faezeh Ramezani Demneh, Bakuri Sheklashvili, Lile Bzekalava

**Figma design:** _add the view-access link here_

## Stack

- Frontend: React (Vite)
- Backend: Node.js, Express.js, REST API
- Database: SQLite (`better-sqlite3`), parameterized queries only
- Auth: bcrypt password hashing, JWT tokens, roles checked on the server

## Run the backend

Requires Node.js 20 or newer.

```
cd backend
copy .env.example .env      (Mac/Linux: cp .env.example .env)
```

Open `.env` and set `JWT_SECRET` to a long random string. Everyone on the team should use the same value locally. Never commit `.env`.

```
npm install
npm run seed      # creates the tables and test data (re-running resets the data)
npm run dev       # http://localhost:4000
```

The schema is in `backend/db/schema.sql`. Seed data (users, categories, suppliers, products, stock movements) is in `backend/db/seed.js`.

## Test logins

| Role    | Email               | Password    |
|---------|---------------------|-------------|
| admin   | admin@example.com   | Admin123!   |
| manager | manager@example.com | Manager123! |
| staff   | staff@example.com   | Staff123!   |

New accounts created through the register page always get the role `staff`.

## Permissions

| Action                                         | Staff | Manager | Admin |
|------------------------------------------------|:-----:|:-------:|:-----:|
| View products, suppliers, categories           | yes   | yes     | yes   |
| Record stock in / stock out                    | yes   | yes     | yes   |
| Create, edit, delete products and suppliers    | no    | yes     | yes   |
| Full movement history with filters             | no    | no      | yes   |
| List users and change roles                    | no    | no      | yes   |

## API

| Method | Route | Who |
|--------|-------|-----|
| POST | /api/auth/register | anyone |
| POST | /api/auth/login | anyone |
| POST | /api/auth/logout | logged in |
| GET | /api/auth/me | logged in |
| GET | /api/products (`?search=&category_id=&supplier_id=&low_stock=1`) | logged in |
| GET | /api/products/:id | logged in |
| POST, PUT, DELETE | /api/products | manager, admin |
| GET | /api/suppliers, /api/categories | logged in |
| POST, PUT, DELETE | /api/suppliers, /api/categories | manager, admin |
| POST | /api/movements (`{product_id, type: IN or OUT, amount, note}`) | logged in |
| GET | /api/movements/product/:id | logged in |
| GET | /api/movements (`?product_id=&user_id=&type=&from=&to=`) | admin |
| GET | /api/admin/users | admin |
| PATCH | /api/admin/users/:id/role | admin |

Errors are always JSON: `{ "error": "message", "details": { "field": "problem" } }`.
A stock out that would take the quantity below zero returns 409 and changes nothing.

## Never commit

`.env`, `*.db`, `node_modules`. Commit `.env.example`.