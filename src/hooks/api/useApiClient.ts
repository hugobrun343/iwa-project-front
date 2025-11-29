import { useMemo, useCallback } from 'react';
import { createApiClient } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { isTokenExpired } from '../../utils/tokenUtils';

export const useApiClient = () => {
  const { accessToken, refreshToken } = useAuth();

  const handleTokenRefresh = useCallback(async () => {
    if (refreshToken) {
      // Force refresh if token is actually expired (not just expiring soon)
      const force = accessToken ? isTokenExpired(accessToken) : false;
      await refreshToken(force);
    }
  }, [refreshToken, accessToken]);

  const client = useMemo(
    () => createApiClient(() => accessToken, undefined, handleTokenRefresh),
    [accessToken, handleTokenRefresh],
  );

  return client;
};

