import { useCallback, useState } from 'react';
import { ApiError } from '../../services/apiClient';

export const useApiHandler = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fn();
        return result;
      } catch (err) {
        setError(err as ApiError);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const resetError = useCallback(() => setError(null), []);

  return {
    execute,
    isLoading,
    error,
    resetError,
  };
};

