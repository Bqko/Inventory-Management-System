import { useEffect, useRef, useState } from 'react';
import { stockStatus } from '../format';

// Colored label: In stock / Low / Out. Color is never the only signal: the text says it too.
export function StatusBadge({ product }) {
  const s = stockStatus(product);
  const label = { ok: 'In stock', low: 'Low', out: 'Out of stock' }[s];
  return <span className={`badge badge-${s}`}>{label}</span>;
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      <div className="page-actions">{children}</div>
    </div>
  );
}

// Loading / error / empty messages used by every list
export function LoadState({ loading, error, empty, emptyText, children }) {
  if (loading) return <p className="state">Loading…</p>;
  if (error) return <p className="state state-error" role="alert">{error}</p>;
  if (empty) return <p className="state">{emptyText}</p>;
  return children;
}

// Label + input + error text, so every form looks the same
export function Field({ label, error, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error" role="alert">{error}</span>}
    </label>
  );
}

// Popup window built on the browser's own <dialog> element
export function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button type="button" className="btn-close" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}

// "Are you sure?" before every delete (required by the assignment)
export function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function confirm() {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      // 409 = linked to other data. A plain 500 on delete almost always means the same.
      setError(err.status === 500 ? 'Could not delete. It may still be used by other records.' : err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <p>{message}</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="btn btn-danger" onClick={confirm} disabled={busy}>
          {busy ? 'Deleting…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
