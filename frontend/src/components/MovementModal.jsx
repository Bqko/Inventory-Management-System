import { useState } from 'react';
import { api } from '../api';
import { Field, Modal } from './ui';

// Stock in / stock out for one product. Every save also changes the product quantity (server side).
export default function MovementModal({ product, onClose, onSaved }) {
  const [type, setType] = useState('OUT');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [details, setDetails] = useState({});
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setDetails({});
    try {
      await api('/api/movements', {
        method: 'POST',
        body: {
          product_id: product.id,
          type,
          amount: amount === '' ? null : Number(amount),
          note: note.trim() || null,
        },
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
      setDetails(err.details || {});
      setBusy(false);
    }
  }

  return (
    <Modal title="Record stock movement" onClose={onClose}>
      <p className="modal-product">
        <span className="mono">{product.sku}</span> {product.name}
        <br />
        <span className="muted">Current quantity: <strong>{product.quantity}</strong></span>
      </p>
      <form onSubmit={submit} noValidate>
        <div className="segmented" role="radiogroup" aria-label="Movement type">
          <button type="button" role="radio" aria-checked={type === 'IN'}
            className={type === 'IN' ? 'active' : ''} onClick={() => setType('IN')}>Stock in</button>
          <button type="button" role="radio" aria-checked={type === 'OUT'}
            className={type === 'OUT' ? 'active' : ''} onClick={() => setType('OUT')}>Stock out</button>
        </div>
        <Field label="Amount" error={details.amount}>
          <input type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        </Field>
        <Field label="Note (optional)" error={details.note}>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Site A, delivery #118" />
        </Field>
        {error && !Object.keys(details).length && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save movement'}</button>
        </div>
      </form>
    </Modal>
  );
}
