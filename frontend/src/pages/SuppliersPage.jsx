import { useState } from 'react';
import { api } from '../api';
import { canManage, useAuth } from '../AuthContext';
import { useLoad } from '../useLoad';
import { ConfirmDialog, Field, LoadState, Modal, PageHeader } from '../components/ui';

function SupplierForm({ supplier, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: supplier?.name || '', email: supplier?.email || '',
    phone: supplier?.phone || '', address: supplier?.address || '',
  });
  const [error, setError] = useState('');
  const [details, setDetails] = useState({});
  const [busy, setBusy] = useState(false);
  const update = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(''); setDetails({});
    try {
      await api(supplier ? `/api/suppliers/${supplier.id}` : '/api/suppliers',
        { method: supplier ? 'PUT' : 'POST', body: form });
      onSaved(); onClose();
    } catch (err) {
      setError(err.message); setDetails(err.details || {}); setBusy(false);
    }
  }

  return (
    <Modal title={supplier ? 'Edit supplier' : 'New supplier'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Name" error={details.name}><input value={form.name} onChange={update('name')} autoFocus /></Field>
        <Field label="Email" error={details.email}><input type="email" value={form.email} onChange={update('email')} /></Field>
        <Field label="Phone" error={details.phone}><input value={form.phone} onChange={update('phone')} /></Field>
        <Field label="Address" error={details.address}><input value={form.address} onChange={update('address')} /></Field>
        {error && !Object.keys(details).length && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function SuppliersPage() {
  const { user } = useAuth();
  const suppliers = useLoad('/api/suppliers');
  const [editing, setEditing] = useState(null); // null | {} (new) | supplier
  const [deleting, setDeleting] = useState(null);
  const list = suppliers.data || [];

  return (
    <div className="page">
      <PageHeader title="Suppliers" subtitle={suppliers.data ? `${list.length} suppliers` : ''}>
        {canManage(user) && <button className="btn btn-primary" onClick={() => setEditing({})}>New supplier</button>}
      </PageHeader>
      <LoadState loading={suppliers.loading && !suppliers.data} error={suppliers.error}
        empty={list.length === 0} emptyText="No suppliers yet.">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th className="num">Products</th><th /></tr></thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.email || '—'}</td>
                  <td>{s.phone || '—'}</td>
                  <td>{s.address || '—'}</td>
                  <td className="num">{s.product_count}</td>
                  <td className="row-actions">
                    {canManage(user) && (
                      <>
                        <button className="btn btn-small" onClick={() => setEditing(s)}>Edit</button>
                        <button className="btn btn-small btn-danger-text" onClick={() => setDeleting(s)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LoadState>

      {editing && <SupplierForm supplier={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={suppliers.reload} />}
      {deleting && (
        <ConfirmDialog title="Delete supplier"
          message={`Delete ${deleting.name}? Suppliers that still have products cannot be deleted.`}
          onConfirm={async () => { await api(`/api/suppliers/${deleting.id}`, { method: 'DELETE' }); suppliers.reload(); }}
          onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}
