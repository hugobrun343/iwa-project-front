import { useMemo, useCallback } from 'react';
import { createApiClient } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

export const useApiClient = () => {
  const { accessToken, refreshToken } = useAuth();

  const handleTokenRefresh = useCallback(async () => {
    if (refreshToken) {
      await refreshToken();
    }
  }, [refreshToken]);

  const client = useMemo(
    () => createApiClient(() => accessToken, undefined, handleTokenRefresh),
    [accessToken, handleTokenRefresh],
  );

  return client;
};

