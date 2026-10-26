import { useCallback, useEffect, useState } from 'react';
import { notificationApi } from '../api/endpoints';
import { useAuth } from './useAuth';

/**
 * Polls the unread notification count for the signed-in user. Returns the count
 * plus a manual refresh function so pages can update the badge after actions.
 */
export function useUnreadNotifications(interval = 60000) {
  const { isAuthenticated } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCount(0);
      return 0;
    }
    try {
      const res = await notificationApi.unreadCount();
      const value = res.data?.data?.unreadCount || 0;
      setCount(value);
      return value;
    } catch (_error) {
      return count;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
    if (!isAuthenticated) return undefined;
    const timer = setInterval(refresh, interval);
    return () => clearInterval(timer);
  }, [refresh, isAuthenticated, interval]);

  return { count, refresh, setCount };
}

export default useUnreadNotifications;
