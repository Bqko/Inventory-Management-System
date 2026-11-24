import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useLoad } from '../useLoad';
import { Field, LoadState, PageHeader } from '../components/ui';

const EMPTY = { sku: '', name: '', category_id: '', supplier_id: '', quantity: '0', min_level: '0', price: '' };

// Same page for "New product" (/products/new) and "Edit product" (/products/:id/edit)
export default function ProductFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const existing = useLoad(editing ? `/api/products/${id}` : null);
  const categories = useLoad('/api/categories');
  const suppliers = useLoad('/api/suppliers');

  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [details, setDetails] = useState({});
  const [busy, setBusy] = useState(false);

  // When editing, fill the form with the saved values
  useEffect(() => {
    const p = existing.data;
    if (p) {
      setForm({
        sku: p.sku, name: p.name,
        category_id: p.category_id ?? '', supplier_id: p.supplier_id ?? '',
        quantity: String(p.quantity), min_level: String(p.min_level), price: String(p.price),
      });
    }
  }, [existing.data]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const num = (v) => (v === '' ? null : Number(v));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setDetails({});
    const body = {
      sku: form.sku, name: form.name,
      category_id: form.category_id === '' ? null : Number(form.category_id),
      supplier_id: form.supplier_id === '' ? null : Number(form.supplier_id),
      quantity: num(form.quantity), min_level: num(form.min_level), price: num(form.price),
    };
    try {
      await api(editing ? `/api/products/${id}` : '/api/products', { method: editing ? 'PUT' : 'POST', body });
      navigate('/products');
    } catch (err) {
      setError(err.message);
      setDetails(err.details || {});
      setBusy(false);
    }
  }

  return (
    <div className="page page-narrow">
      <PageHeader title={editing ? 'Edit product' : 'New product'} />
      <LoadState loading={editing && existing.loading} error={existing.error}>
        <form onSubmit={submit} className="form" noValidate>
          <div className="form-grid">
            <Field label="SKU" error={details.sku}><input className="mono" value={form.sku} onChange={update('sku')} autoFocus /></Field>
            <Field label="Price" error={details.price}><input type="number" step="0.01" min="0" value={form.price} onChange={update('price')} /></Field>
          </div>
          <Field label="Name" error={details.name}><input value={form.name} onChange={update('name')} /></Field>
          <div className="form-grid">
            <Field label="Category" error={details.category_id}>
              <select value={form.category_id} onChange={update('category_id')}>
                <option value="">None</option>
                {(categories.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Supplier" error={details.supplier_id}>
              <select value={form.supplier_id} onChange={update('supplier_id')}>
                <option value="">None</option>
                {(suppliers.data || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="form-grid">
            <Field label="Quantity" error={details.quantity}
              hint={editing ? 'For normal changes use Stock in/out so the history is kept.' : undefined}>
              <input type="number" min="0" step="1" value={form.quantity} onChange={update('quantity')} />
            </Field>
            <Field label="Minimum level" error={details.min_level} hint="Below this the product appears in Low stock">
              <input type="number" min="0" step="1" value={form.min_level} onChange={update('min_level')} />
            </Field>
          </div>
          {error && !Object.keys(details).length && <p className="form-error" role="alert">{error}</p>}
          <div className="form-actions">
            <Link to="/products" className="btn">Cancel</Link>
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create product'}</button>
          </div>
        </form>
      </LoadState>
    </div>
  );
}
