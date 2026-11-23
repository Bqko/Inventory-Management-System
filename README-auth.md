# Authentication and roles (Member A)

## Run it (needs Node 22.13 or newer, nothing to compile)
```
cd server
npm install
cp .env.example .env        # then set JWT_SECRET to a long random string
npm run db:init             # creates the users table from ../schema.sql
npm run db:seed             # creates one test account per role
npm run dev                 # http://localhost:4000
```

## Test logins (seed data)
| Role    | Email               | Password     |
|---------|---------------------|--------------|
| admin   | admin@example.com   | Admin123!    |
| manager | manager@example.com | Manager123!  |
| staff   | staff@example.com   | Staff123!    |

## API
| Method | Route                          | Who            |
|--------|--------------------------------|----------------|
| POST   | /api/auth/register             | anyone (gets role staff) |
| POST   | /api/auth/login                | anyone         |
| POST   | /api/auth/logout               | logged in      |
| GET    | /api/auth/me                   | logged in      |
| GET    | /api/admin/users               | admin          |
| PATCH  | /api/admin/users/:id/role      | admin          |
| GET    | /api/demo/any-role             | logged in      |
| GET    | /api/demo/manager-area         | manager, admin |
| GET    | /api/demo/admin-area           | admin          |

## Test with curl (use Git Bash, or Postman / Thunder Client)
```
# 1. login as staff, copy the token from the response
curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"staff@example.com\",\"password\":\"Staff123!\"}"

# 2. no token -> 401
curl http://localhost:4000/api/demo/any-role

# 3. staff on a manager-only route -> 403
curl http://localhost:4000/api/demo/manager-area -H "Authorization: Bearer PASTE_TOKEN"

# 4. login as manager, same route -> 200
# 5. wrong password -> 401 "Invalid email or password"
# 6. register with an existing email -> 409; weak password -> 400
```

## Test checklist
- [ ] Register works; the new user is role staff, even if the body contains "role":"admin"
- [ ] Duplicate email returns 409
- [ ] Short or weak password returns 400 with details
- [ ] Wrong password returns 401 with a generic message
- [ ] Correct login returns a token
- [ ] No token returns 401
- [ ] Staff on manager-area returns 403
- [ ] Manager on manager-area returns 200; manager on admin-area returns 403
- [ ] Admin can list users and change another user's role
- [ ] In the database, password_hash starts with $2a$ (hashed, not plain text)
- [ ] After refreshing the React app you are still logged in; after logout you are not

## Handoff
- Member B: merge the users table from schema.sql; protect routes with `authenticate` and `requireRole(...)` (see comment in server/src/index.js); link stock_movements.user_id to users(id); delete routes/demo.js when done.
- Member C: style LoginPage and RegisterPage to match Figma; use `useAuth()` for the user, role and logout button; hide controls with `user.role`.

## Never commit
`.env` and `*.db` (already in server/.gitignore). Commit `.env.example`.
