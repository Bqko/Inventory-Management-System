import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

// Loads data from the API and keeps loading / error state.
// const { data, loading, error, reload } = useLoad('/api/products');
// Pass null as the path to skip loading.
export function useLoad(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    setLoading(true);
    api(path)
      .then((d) => !cancelled && (setData(d), setError('')))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [path, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, reload };
}
