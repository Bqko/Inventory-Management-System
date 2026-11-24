import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useLoad } from '../useLoad';
import { asList, formatDate } from '../format';
import { LoadState, PageHeader } from '../components/ui';

// Admin only: list users and change their role
export default function UsersPage() {
  const { user: me } = useAuth();
  const users = useLoad('/api/admin/users');
  const [error, setError] = useState('');
  const list = asList(users.data);

  async function changeRole(id, role) {
    setError('');
    try {
      await api(`/api/admin/users/${id}/role`, { method: 'PATCH', body: { role } });
      users.reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page page-narrow">
      <PageHeader title="Users" subtitle="Change who can do what" />
      {error && <p className="form-error" role="alert">{error}</p>}
      <LoadState loading={users.loading && !users.data} error={users.error} empty={list.length === 0} emptyText="No users.">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Role</th></tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}{u.id === me.id && <span className="muted"> (you)</span>}</td>
                  <td>{u.email}</td>
                  <td>{formatDate(u.created_at)}</td>
                  <td>
                    <select value={u.role} disabled={u.id === me.id} aria-label={`Role of ${u.name}`}
                      onChange={(e) => changeRole(u.id, e.target.value)}>
                      <option value="staff">staff</option>
                      <option value="manager">manager</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LoadState>
    </div>
  );
}
