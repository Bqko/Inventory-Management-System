// Automated tests for authentication and roles.
// 1) Start the server in one terminal:  npm run dev
// 2) In a second terminal (in the server folder):  node test-api.js
// Requires the seed accounts (npm run db:seed). Node 22+ (uses built-in fetch).

const BASE = process.env.API_URL || 'http://localhost:4000';

let passed = 0;
let failed = 0;

async function call(method, path, { body, token, rawAuth } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (rawAuth) headers.Authorization = rawAuth;
  else if (token) headers.Authorization = 'Bearer ' + token;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function check(name, condition, extra) {
  if (condition) {
    passed++;
    console.log('  PASS  ' + name);
  } else {
    failed++;
    console.log('  FAIL  ' + name + (extra ? '   -> ' + extra : ''));
  }
}

function section(title) {
  console.log('\n' + title);
}

async function login(email, password) {
  const r = await call('POST', '/api/auth/login', { body: { email, password } });
  return r.data.token;
}

async function main() {
  const stamp = Date.now();
  const newEmail = 'test' + stamp + '@example.com';

  section('Server');
  let r = await call('GET', '/api/health');
  check('health returns 200', r.status === 200, 'status ' + r.status);

  section('A. Register');
  r = await call('POST', '/api/auth/register', {
    body: { name: 'Test User', email: newEmail, password: 'Test1234' },
  });
  check('valid register returns 201', r.status === 201, 'status ' + r.status);
  check('new user gets a token', !!r.data.token);
  check('new user has role staff', r.data.user && r.data.user.role === 'staff');
  const testUserId = r.data.user && r.data.user.id;

  r = await call('POST', '/api/auth/register', {
    body: { name: 'Test User', email: newEmail, password: 'Test1234' },
  });
  check('duplicate email returns 409', r.status === 409, 'status ' + r.status);

  r = await call('POST', '/api/auth/register', {
    body: { name: 'Weak', email: 'weak' + stamp + '@example.com', password: 'abc' },
  });
  check('weak password returns 400', r.status === 400, 'status ' + r.status);
  check('weak password gives details.password', !!(r.data.details && r.data.details.password));

  r = await call('POST', '/api/auth/register', {
    body: { name: 'Bad Email', email: 'notanemail', password: 'Test1234' },
  });
  check('bad email returns 400', r.status === 400, 'status ' + r.status);
  check('bad email gives details.email', !!(r.data.details && r.data.details.email));

  r = await call('POST', '/api/auth/register', {
    body: { name: 'Sneaky', email: 'sneaky' + stamp + '@example.com', password: 'Test1234', role: 'admin' },
  });
  check('role injection: register still returns 201', r.status === 201, 'status ' + r.status);
  check('role injection: role is still staff', r.data.user && r.data.user.role === 'staff', 'role ' + (r.data.user && r.data.user.role));

  section('B. Login');
  r = await call('POST', '/api/auth/login', { body: { email: 'staff@example.com', password: 'Staff123!' } });
  check('staff login returns 200', r.status === 200, 'status ' + r.status + ' (did you run npm run db:seed?)');
  check('staff login returns a token', !!r.data.token);
  check('staff login shows role staff', r.data.user && r.data.user.role === 'staff');
  const staffToken = r.data.token;

  r = await call('POST', '/api/auth/login', { body: { email: 'staff@example.com', password: 'WrongPass1' } });
  check('wrong password returns 401', r.status === 401, 'status ' + r.status);
  const wrongPwMessage = r.data.error;

  r = await call('POST', '/api/auth/login', { body: { email: 'nobody@example.com', password: 'WrongPass1' } });
  check('unknown email returns 401', r.status === 401, 'status ' + r.status);
  check('unknown email gives the SAME message as wrong password', r.data.error === wrongPwMessage, r.data.error + ' vs ' + wrongPwMessage);

  r = await call('POST', '/api/auth/login');
  check('empty login body returns 400', r.status === 400, 'status ' + r.status);

  r = await call('POST', '/api/auth/login', { body: { email: "' OR 1=1 --", password: 'x' } });
  check('SQL injection attempt does NOT log in', r.status === 401 || r.status === 400, 'status ' + r.status);
  check('SQL injection attempt gets no token', !r.data.token);

  section('C. Tokens and 401');
  r = await call('GET', '/api/auth/me');
  check('/me without token returns 401', r.status === 401, 'status ' + r.status);

  r = await call('GET', '/api/auth/me', { token: staffToken });
  check('/me with token returns 200', r.status === 200, 'status ' + r.status);
  check('/me returns the staff user', r.data.user && r.data.user.email === 'staff@example.com');

  r = await call('GET', '/api/auth/me', { token: staffToken + 'x' });
  check('tampered token returns 401', r.status === 401, 'status ' + r.status);

  r = await call('GET', '/api/auth/me', { rawAuth: staffToken });
  check('token without "Bearer" returns 401', r.status === 401, 'status ' + r.status);

  section('D. Roles and 403');
  const managerToken = await login('manager@example.com', 'Manager123!');
  const adminToken = await login('admin@example.com', 'Admin123!');
  check('manager and admin logins work', !!managerToken && !!adminToken);

  const matrix = [
    ['/api/demo/any-role', 200, 200, 200],
    ['/api/demo/manager-area', 403, 200, 200],
    ['/api/demo/admin-area', 403, 403, 200],
    ['/api/admin/users', 403, 403, 200],
  ];
  for (const [path, s, m, a] of matrix) {
    let x = await call('GET', path, { token: staffToken });
    check('staff   GET ' + path + ' -> ' + s, x.status === s, 'got ' + x.status);
    x = await call('GET', path, { token: managerToken });
    check('manager GET ' + path + ' -> ' + m, x.status === m, 'got ' + x.status);
    x = await call('GET', path, { token: adminToken });
    check('admin   GET ' + path + ' -> ' + a, x.status === a, 'got ' + x.status);
    x = await call('GET', path);
    check('no token GET ' + path + ' -> 401', x.status === 401, 'got ' + x.status);
  }

  section('E. Admin features');
  r = await call('GET', '/api/admin/users', { token: adminToken });
  check('admin sees the users list', r.status === 200 && Array.isArray(r.data.users) && r.data.users.length >= 3);
  const adminRow = (r.data.users || []).find((u) => u.email === 'admin@example.com');
  check('users list never contains password hashes', !JSON.stringify(r.data).includes('password_hash'));

  r = await call('PATCH', '/api/admin/users/' + testUserId + '/role', { token: staffToken, body: { role: 'manager' } });
  check('staff cannot change roles (403)', r.status === 403, 'status ' + r.status);

  r = await call('PATCH', '/api/admin/users/' + (adminRow && adminRow.id) + '/role', { token: adminToken, body: { role: 'staff' } });
  check('admin cannot change their own role (400)', r.status === 400, 'status ' + r.status);

  r = await call('PATCH', '/api/admin/users/' + testUserId + '/role', { token: adminToken, body: { role: 'superuser' } });
  check('invalid role returns 400', r.status === 400, 'status ' + r.status);

  r = await call('PATCH', '/api/admin/users/999999/role', { token: adminToken, body: { role: 'staff' } });
  check('unknown user id returns 404', r.status === 404, 'status ' + r.status);

  section('F. Role change takes effect immediately');
  const testToken = await login(newEmail, 'Test1234');
  r = await call('GET', '/api/demo/admin-area', { token: testToken });
  check('new staff user is blocked from admin-area (403)', r.status === 403, 'status ' + r.status);
  r = await call('PATCH', '/api/admin/users/' + testUserId + '/role', { token: adminToken, body: { role: 'admin' } });
  check('admin promotes the test user (200)', r.status === 200, 'status ' + r.status);
  r = await call('GET', '/api/demo/admin-area', { token: testToken });
  check('same OLD token now works for admin-area (200)', r.status === 200, 'status ' + r.status);
  r = await call('PATCH', '/api/admin/users/' + testUserId + '/role', { token: adminToken, body: { role: 'staff' } });
  check('admin demotes the test user back (200)', r.status === 200, 'status ' + r.status);
  r = await call('GET', '/api/demo/admin-area', { token: testToken });
  check('old token is blocked again (403)', r.status === 403, 'status ' + r.status);

  section('G. Logout');
  r = await call('POST', '/api/auth/logout', { token: staffToken });
  check('logout returns 200', r.status === 200, 'status ' + r.status);
  r = await call('POST', '/api/auth/logout');
  check('logout without token returns 401', r.status === 401, 'status ' + r.status);

  console.log('\n----------------------------------------');
  console.log('Passed: ' + passed + '   Failed: ' + failed);
  console.log(failed === 0 ? 'ALL TESTS PASSED' : 'Some tests failed. Copy the FAIL lines and send them to Claude.');
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('\nCould not run the tests. Is the server running on ' + BASE + ' ?');
  console.error(err.message);
  process.exit(1);
});
