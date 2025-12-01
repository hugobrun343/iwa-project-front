import { useCallback } from 'react';
import { useApiClient } from './useApiClient';
import { useApiHandler } from './useApiHandler';
import {
  PaginationParams,
  PaginatedResponse,
  RatingDto,
  RatingPayload,
} from '../../types/api';

export const useRatingsApi = () => {
  const { request } = useApiClient();
  const { execute, error, isLoading, resetError } = useApiHandler();

  const createRating = useCallback(
    (recipientId: string, payload: RatingPayload) =>
      execute(() =>
        request<RatingDto, RatingPayload>(`/api/ratings/${recipientId}`, {
          method: 'POST',
          body: payload,
        }),
      ),
    [execute, request],
  );

  const getRatingById = useCallback(
    (id: number) => execute(() => request<RatingDto>(`/api/ratings/${id}`)),
    [execute, request],
  );

  const getRatingsReceived = useCallback(
    (recipientId: string, params?: PaginationParams) =>
      execute(() =>
        request<PaginatedResponse<RatingDto>>(`/api/ratings/recipient/${recipientId}`, {
          query: params,
        }),
      ),
    [execute, request],
  );

  const getRatingsGiven = useCallback(
    (authorId: string, params?: PaginationParams) =>
      execute(() =>
        request<PaginatedResponse<RatingDto>>(`/api/ratings/author/${authorId}`, {
          query: params,
        }),
      ),
    [execute, request],
  );

  const getAverageRating = useCallback(
    (recipientId: string) =>
      execute(() => request<number>(`/api/ratings/recipient/${recipientId}/average`)),
    [execute, request],
  );

  const getRatingCount = useCallback(
    (recipientId: string) =>
      execute(() => request<number>(`/api/ratings/recipient/${recipientId}/count`)),
    [execute, request],
  );

  const updateRating = useCallback(
    (id: number, payload: RatingPayload) =>
      execute(() =>
        request<RatingDto, RatingPayload>(`/api/ratings/${id}`, {
          method: 'PUT',
          body: payload,
        }),
      ),
    [execute, request],
  );

  const deleteRating = useCallback(
    (id: number) =>
      execute(() =>
        request<void>(`/api/ratings/${id}`, {
          method: 'DELETE',
        }),
      ),
    [execute, request],
  );

  return {
    isLoading,
    error,
    resetError,
    createRating,
    getRatingById,
    getRatingsReceived,
    getRatingsGiven,
    getAverageRating,
    getRatingCount,
    updateRating,
    deleteRating,
  };
};

