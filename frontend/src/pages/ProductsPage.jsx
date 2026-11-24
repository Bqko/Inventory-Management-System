import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { canManage, useAuth } from '../AuthContext';
import { useLoad } from '../useLoad';
import { formatPrice } from '../format';
import { ConfirmDialog, LoadState, PageHeader, StatusBadge } from '../components/ui';
import MovementModal from '../components/MovementModal';

export default function ProductsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [moving, setMoving] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Wait until the user stops typing before asking the server
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const params = new URLSearchParams();
  if (debounced) params.set('search', debounced);
  if (categoryId) params.set('category_id', categoryId);
  if (lowOnly) params.set('low_stock', '1');

  const products = useLoad('/api/products?' + params.toString());
  const categories = useLoad('/api/categories');
  const list = products.data || [];
  const filtered = debounced || categoryId || lowOnly;

  return (
    <div className="page">
      <PageHeader title="Products" subtitle={products.data ? `${list.length} shown` : ''}>
        {canManage(user) && <Link to="/products/new" className="btn btn-primary">New product</Link>}
      </PageHeader>

      <div className="filters">
        <input type="search" placeholder="Search name or SKU" value={search}
          onChange={(e) => setSearch(e.target.value)} aria-label="Search products" />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {(categories.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="check">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} />
          Low stock only
        </label>
      </div>

      <LoadState loading={products.loading && !products.data} error={products.error}
        empty={list.length === 0} emptyText={filtered ? 'No products match these filters.' : 'No products yet.'}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th><th>Product</th><th>Category</th><th>Supplier</th>
                <th className="num">Qty</th><th className="num">Min</th><th className="num">Price</th>
                <th>Status</th><th />
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td className="mono">{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{p.category_name || '—'}</td>
                  <td>{p.supplier_name || '—'}</td>
                  <td className="num"><strong>{p.quantity}</strong></td>
                  <td className="num">{p.min_level}</td>
                  <td className="num">{formatPrice(p.price)}</td>
                  <td><StatusBadge product={p} /></td>
                  <td className="row-actions">
                    <button className="btn btn-small" onClick={() => setMoving(p)}>Stock in/out</button>
                    {canManage(user) && (
                      <>
                        <Link className="btn btn-small" to={`/products/${p.id}/edit`}>Edit</Link>
                        <button className="btn btn-small btn-danger-text" onClick={() => setDeleting(p)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LoadState>

      {moving && <MovementModal product={moving} onClose={() => setMoving(null)} onSaved={products.reload} />}
      {deleting && (
        <ConfirmDialog
          title="Delete product"
          message={`Delete ${deleting.sku} – ${deleting.name}? This cannot be undone.`}
          onConfirm={async () => { await api(`/api/products/${deleting.id}`, { method: 'DELETE' }); products.reload(); }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
