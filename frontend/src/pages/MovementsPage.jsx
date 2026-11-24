import { useState } from 'react';
import { useLoad } from '../useLoad';
import { asList, formatDate } from '../format';
import { LoadState, PageHeader } from '../components/ui';

// Admin only: full movement history with filters
export default function MovementsPage() {
  const [filters, setFilters] = useState({ type: '', product_id: '', user_id: '', from: '', to: '' });
  const products = useLoad('/api/products');
  const users = useLoad('/api/admin/users');

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
  const movements = useLoad('/api/movements?' + params.toString());
  const list = movements.data || [];
  const set = (f) => (e) => setFilters({ ...filters, [f]: e.target.value });
  const anyFilter = Object.values(filters).some(Boolean);

  return (
    <div className="page">
      <PageHeader title="Movement history" subtitle={movements.data ? `${list.length} movements` : ''} />
      <div className="filters">
        <select value={filters.type} onChange={set('type')} aria-label="Type">
          <option value="">In and out</option><option value="IN">Stock in</option><option value="OUT">Stock out</option>
        </select>
        <select value={filters.product_id} onChange={set('product_id')} aria-label="Product">
          <option value="">All products</option>
          {(products.data || []).map((p) => <option key={p.id} value={p.id}>{p.sku} {p.name}</option>)}
        </select>
        <select value={filters.user_id} onChange={set('user_id')} aria-label="User">
          <option value="">All users</option>
          {asList(users.data).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <label className="inline-field">From <input type="date" value={filters.from} onChange={set('from')} /></label>
        <label className="inline-field">To <input type="date" value={filters.to} onChange={set('to')} /></label>
        {anyFilter && (
          <button className="btn btn-small" onClick={() => setFilters({ type: '', product_id: '', user_id: '', from: '', to: '' })}>Clear</button>
        )}
      </div>

      <LoadState loading={movements.loading && !movements.data} error={movements.error}
        empty={list.length === 0} emptyText={anyFilter ? 'No movements match these filters.' : 'No movements yet.'}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>When</th><th>Product</th><th>Type</th><th className="num">Amount</th><th>By</th><th>Note</th></tr></thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id}>
                  <td>{formatDate(m.created_at)}</td>
                  <td><span className="mono">{m.sku}</span> {m.product_name}</td>
                  <td><span className={`tag tag-${m.type.toLowerCase()}`}>{m.type === 'IN' ? 'In' : 'Out'}</span></td>
                  <td className="num">{m.amount}</td>
                  <td>{m.user_name}</td>
                  <td>{m.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LoadState>
    </div>
  );
}
