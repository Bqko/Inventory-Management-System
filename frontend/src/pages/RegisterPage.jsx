import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Field } from '../components/ui';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [details, setDetails] = useState({});
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setDetails({});
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
      setDetails(err.details || {});
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth-side">
        <div className="brand">Inventory</div>
        <h2>New accounts start with the Staff role.</h2>
        <p className="muted-on-dark">An admin can change your role later.</p>
      </section>
      <section className="auth-main">
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <h1>Create account</h1>
          <Field label="Name" error={details.name}>
            <input value={form.name} onChange={update('name')} autoFocus />
          </Field>
          <Field label="Email" error={details.email}>
            <input type="email" value={form.email} onChange={update('email')} />
          </Field>
          <Field label="Password" error={details.password} hint="At least 8 characters, with a letter and a number">
            <input type="password" value={form.password} onChange={update('password')} />
          </Field>
          {error && !Object.keys(details).length && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
          <p className="auth-switch">Already registered? <Link to="/login">Log in</Link></p>
        </form>
      </section>
    </div>
  );
}
