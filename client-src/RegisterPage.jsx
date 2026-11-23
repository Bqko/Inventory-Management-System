import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Logic only. Member C styles this to match the Figma design.
export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [details, setDetails] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setDetails({});
    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/products');
    } catch (err) {
      setError(err.message);
      setDetails(err.details || {});
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Create account</h1>
      <label>
        Name
        <input value={form.name} onChange={update('name')} required />
      </label>
      {details.name && <p role="alert">{details.name}</p>}
      <label>
        Email
        <input type="email" value={form.email} onChange={update('email')} required />
      </label>
      {details.email && <p role="alert">{details.email}</p>}
      <label>
        Password
        <input type="password" value={form.password} onChange={update('password')} required />
      </label>
      {details.password && <p role="alert">{details.password}</p>}
      {error && !Object.keys(details).length && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
