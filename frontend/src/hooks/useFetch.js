import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Generic data fetching hook for GET style requests.
 *
 * const { data, loading, error, meta, refetch } = useFetch(() => jobApi.list(params), [params]);
 *
 * The fetcher is stored in a ref so that inline arrow functions do not cause an
 * infinite refetch loop; `deps` controls when the request actually re-runs.
 */
export function useFetch(fetcher, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  const mountedRef = useRef(true);

  fetcherRef.current = fetcher;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcherRef.current();
      if (!mountedRef.current) return;
      setData(res?.data?.data ?? null);
      setMeta(res?.data?.meta ?? null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.friendlyMessage || err.message || 'Something went wrong.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (immediate) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, meta, loading, error, refetch: run, setData };
}

export default useFetch;
