import { useCallback } from 'react';
import { useApiClient } from './useApiClient';
import { useApiHandler } from './useApiHandler';
import {
    AnnouncementFilters,
    AnnouncementPayload,
    AnnouncementResponseDto,
    AnnouncementStatus,
    CareTypeDto
} from '../../types/api';
import { QueryParamValue } from '../../services/apiClient';

const toQueryRecord = (filters?: AnnouncementFilters): Record<string, QueryParamValue> | undefined => {
  if (!filters) return undefined;

  return Object.entries(filters).reduce<Record<string, QueryParamValue>>((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc;
    }
    acc[key] = value as QueryParamValue;
    return acc;
  }, {});
};

interface UpdateAnnouncementStatusParams {
  status: AnnouncementStatus;
}

export const useAnnouncementsApi = () => {
  const { request } = useApiClient();
  const { execute, error, isLoading, resetError } = useApiHandler();

  const createAnnouncement = useCallback(
    (payload: AnnouncementPayload) =>
      execute(() =>
        request<AnnouncementResponseDto, AnnouncementPayload>('/api/announcements', {
          method: 'POST',
          body: payload,
        }),
      ),
    [execute, request],
  );

  const updateAnnouncement = useCallback(
    (id: number, payload: AnnouncementPayload) =>
      execute(() =>
        request<AnnouncementResponseDto, AnnouncementPayload>(`/api/announcements/${id}`, {
          method: 'PUT',
          body: payload,
        }),
      ),
    [execute, request],
  );

  const updateAnnouncementStatus = useCallback(
    (id: number, status: AnnouncementStatus) =>
      execute(() =>
        request<AnnouncementResponseDto, void>(`/api/announcements/${id}/status`, {
          method: 'PATCH',
          query: { status },
        }),
      ),
    [execute, request],
  );

  const deleteAnnouncement = useCallback(
    (id: number) =>
      execute(() =>
        request<void>(`/api/announcements/${id}`, {
          method: 'DELETE',
        }),
      ),
    [execute, request],
  );

  const getAnnouncementById = useCallback(
    (id: number) => execute(() => request<AnnouncementResponseDto>(`/api/announcements/${id}`)),
    [execute, request],
  );

  const listAnnouncements = useCallback(
    (filters?: AnnouncementFilters) =>
      execute(() =>
        request<AnnouncementResponseDto[]>('/api/announcements', {
          query: toQueryRecord(filters),
        }),
      ),
    [execute, request],
  );

  const listAnnouncementsByOwner = useCallback(
    (ownerUsername: string) =>
      execute(() =>
        request<AnnouncementResponseDto[]>(`/api/announcements/owner/${ownerUsername}`),
      ),
    [execute, request],
  );

  const listAnnouncementsByStatus = useCallback(
    (status: AnnouncementStatus) =>
      execute(() =>
        request<AnnouncementResponseDto[]>(`/api/announcements/status/${status}`),
      ),
    [execute, request],
  );

  const listCareTypes = useCallback(
    () =>
      execute(() =>
        request<CareTypeDto[]>(`/api/announcements/care-types`),
      ),
    [execute, request],
  );

  return {
    isLoading,
    error,
    resetError,
    createAnnouncement,
    updateAnnouncement,
    updateAnnouncementStatus,
    deleteAnnouncement,
    getAnnouncementById,
    listAnnouncements,
    listAnnouncementsByOwner,
    listAnnouncementsByStatus,
    listCareTypes,
  };
};

