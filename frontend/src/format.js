// The database stores UTC times like "2026-11-16 09:12:00".
export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value.replace(' ', 'T') + 'Z');
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export const formatPrice = (n) =>
  Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// "ok" | "low" | "out" - used for the colored stock status
export function stockStatus(p) {
  if (p.quantity === 0) return 'out';
  if (p.is_low) return 'low';
  return 'ok';
}

// The users endpoint answers { users: [...] }; other endpoints answer a plain array.
export function asList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.users)) return data.users;
  return [];
}
