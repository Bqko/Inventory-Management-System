import { useState } from 'react';
import { api } from '../api';
import { canManage, useAuth } from '../AuthContext';
import { useLoad } from '../useLoad';
import { ConfirmDialog, Field, LoadState, Modal, PageHeader } from '../components/ui';

function CategoryForm({ category, onClose, onSaved }) {
  const [name, setName] = useState(category?.name || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await api(category ? `/api/categories/${category.id}` : '/api/categories',
        { method: category ? 'PUT' : 'POST', body: { name } });
      onSaved(); onClose();
    } catch (err) {
      setError(err.details?.name || err.message); setBusy(false);
    }
  }

  return (
    <Modal title={category ? 'Rename category' : 'New category'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <Field label="Name" error={error}><input value={name} onChange={(e) => setName(e.target.value)} autoFocus /></Field>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function CategoriesPage() {
  const { user } = useAuth();
  const categories = useLoad('/api/categories');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const list = categories.data || [];

  return (
    <div className="page page-narrow">
      <PageHeader title="Categories">
        {canManage(user) && <button className="btn btn-primary" onClick={() => setEditing({})}>New category</button>}
      </PageHeader>
      <LoadState loading={categories.loading && !categories.data} error={categories.error}
        empty={list.length === 0} emptyText="No categories yet.">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th /></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td className="row-actions">
                    {canManage(user) && (
                      <>
                        <button className="btn btn-small" onClick={() => setEditing(c)}>Rename</button>
                        <button className="btn btn-small btn-danger-text" onClick={() => setDeleting(c)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LoadState>
      {editing && <CategoryForm category={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={categories.reload} />}
      {deleting && (
        <ConfirmDialog title="Delete category"
          message={`Delete the category "${deleting.name}"? Categories that still have products cannot be deleted.`}
          onConfirm={async () => { await api(`/api/categories/${deleting.id}`, { method: 'DELETE' }); categories.reload(); }}
          onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}
