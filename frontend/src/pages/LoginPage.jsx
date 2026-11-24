import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Field } from '../components/ui';

// Test accounts from the seed data (backend/db/seed.js). Clicking one fills the form.
const DEMO = [
  { role: 'Admin', email: 'admin@example.com', password: 'Admin123!' },
  { role: 'Manager', email: 'manager@example.com', password: 'Manager123!' },
  { role: 'Staff', email: 'staff@example.com', password: 'Staff123!' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth-side">
        <div className="brand">Inventory</div>
        <h2>Stock levels, suppliers and every movement in one place.</h2>
        <dl className="role-list">
          <dt>Staff</dt><dd>records stock in and stock out</dd>
          <dt>Manager</dt><dd>manages products and suppliers</dd>
          <dt>Admin</dt><dd>sees the full movement history and manages users</dd>
        </dl>
      </section>
      <section className="auth-main">
        <form onSubmit={handleSubmit} className="auth-form">
          <h1>Log in</h1>
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </Field>
          <Field label="Password">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
          <p className="auth-switch">No account? <Link to="/register">Create one</Link></p>
        </form>

        <div className="demo-box">
          <p className="demo-title">Test accounts</p>
          {DEMO.map((d) => (
            <button key={d.role} type="button" className="demo-row"
              onClick={() => { setEmail(d.email); setPassword(d.password); }}>
              <span>{d.role}</span><span className="mono">{d.email}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
