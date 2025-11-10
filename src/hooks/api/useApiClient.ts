import { useMemo } from 'react';
import { createApiClient } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

export const useApiClient = () => {
  const { accessToken } = useAuth();

  const client = useMemo(
    () => createApiClient(() => accessToken),
    [accessToken],
  );

  return client;
};

