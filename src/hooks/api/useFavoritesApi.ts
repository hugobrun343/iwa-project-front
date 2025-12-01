import { useCallback } from 'react';
import { useApiClient } from './useApiClient';
import { useApiHandler } from './useApiHandler';
import {
  FavoriteCheckResponse,
  FavoriteCreatePayload,
  FavoriteDto,
} from '../../types/api';

export const useFavoritesApi = () => {
  const { request } = useApiClient();
  const { execute, error, isLoading, resetError } = useApiHandler();

  const getFavorites = useCallback(
    () => execute(() => request<FavoriteDto[]>('/api/favorites')),
    [execute, request],
  );

  const checkFavorite = useCallback(
    (announcementId: number) =>
      execute(() =>
        request<FavoriteCheckResponse>('/api/favorites/check', {
          query: { announcementId },
        }),
      ),
    [execute, request],
  );

  const addFavorite = useCallback(
    (payload: FavoriteCreatePayload) =>
      execute(() =>
        request<FavoriteDto, FavoriteCreatePayload>('/api/favorites', {
          method: 'POST',
          body: payload,
        }),
      ),
    [execute, request],
  );

  const removeFavorite = useCallback(
    (announcementId: number) =>
      execute(() =>
        request<void>(`/api/favorites/${announcementId}`, {
          method: 'DELETE',
        }),
      ),
    [execute, request],
  );

  return {
    isLoading,
    error,
    resetError,
    getFavorites,
    checkFavorite,
    addFavorite,
    removeFavorite,
  };
};

