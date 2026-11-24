import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useLoad } from '../useLoad';
import { formatDate } from '../format';
import { LoadState, PageHeader, StatusBadge } from '../components/ui';
import MovementModal from '../components/MovementModal';

// All numbers here are calculated from the real API data, nothing is hard-coded.
export default function DashboardPage() {
  const { user } = useAuth();
  const products = useLoad('/api/products');
  const suppliers = useLoad('/api/suppliers');
  const recent = useLoad(user.role === 'admin' ? '/api/movements?limit=8' : null);
  const [moving, setMoving] = useState(null);

  const list = products.data || [];
  const low = list.filter((p) => p.is_low).sort((a, b) => a.quantity - b.quantity);
  const out = list.filter((p) => p.quantity === 0).length;

  return (
    <div className="page">
      <PageHeader title="Dashboard" subtitle={`Signed in as ${user.name}`} />

      <div className="stats">
        <div><span className="stat-num">{list.length}</span><span className="stat-label">Products</span></div>
        <div className={low.length ? 'stat-warn' : ''}><span className="stat-num">{low.length}</span><span className="stat-label">At or below minimum</span></div>
        <div className={out ? 'stat-bad' : ''}><span className="stat-num">{out}</span><span className="stat-label">Out of stock</span></div>
        <div><span className="stat-num">{suppliers.data ? suppliers.data.length : '–'}</span><span className="stat-label">Suppliers</span></div>
      </div>

      <section className="block">
        <div className="block-head">
          <h2>Low stock</h2>
          <Link to="/products">All products</Link>
        </div>
        <LoadState loading={products.loading} error={products.error} empty={low.length === 0}
          emptyText="Nothing is below its minimum level.">
          <div className="table-wrap">
            <table>
              <thead><tr><th>SKU</th><th>Product</th><th>Supplier</th><th className="num">Qty</th><th className="num">Min</th><th>Status</th><th /></tr></thead>
              <tbody>
                {low.map((p) => (
                  <tr key={p.id}>
                    <td className="mono">{p.sku}</td>
                    <td>{p.name}</td>
                    <td>{p.supplier_name || '—'}</td>
                    <td className="num"><strong>{p.quantity}</strong></td>
                    <td className="num">{p.min_level}</td>
                    <td><StatusBadge product={p} /></td>
                    <td className="row-actions"><button className="btn btn-small" onClick={() => setMoving(p)}>Stock in/out</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </LoadState>
      </section>

      {user.role === 'admin' && (
        <section className="block">
          <div className="block-head">
            <h2>Latest movements</h2>
            <Link to="/movements">Full history</Link>
          </div>
          <LoadState loading={recent.loading} error={recent.error} empty={(recent.data || []).length === 0}
            emptyText="No movements yet.">
            <div className="table-wrap">
              <table>
                <thead><tr><th>When</th><th>Product</th><th>Type</th><th className="num">Amount</th><th>By</th></tr></thead>
                <tbody>
                  {(recent.data || []).map((m) => (
                    <tr key={m.id}>
                      <td>{formatDate(m.created_at)}</td>
                      <td><span className="mono">{m.sku}</span> {m.product_name}</td>
                      <td><span className={`tag tag-${m.type.toLowerCase()}`}>{m.type === 'IN' ? 'In' : 'Out'}</span></td>
                      <td className="num">{m.amount}</td>
                      <td>{m.user_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </LoadState>
        </section>
      )}

      {moving && <MovementModal product={moving} onClose={() => setMoving(null)} onSaved={products.reload} />}
    </div>
  );
}
