import { useCallback } from 'react';
import { useApiClient } from './useApiClient';
import { useApiHandler } from './useApiHandler';
import {
  ApplicationFilters,
  ApplicationPayload,
  ApplicationResponseDto,
} from '../../types/api';
import { QueryParamValue } from '../../services/apiClient';

const toQueryRecord = (filters?: ApplicationFilters): Record<string, QueryParamValue> | undefined => {
    if (!filters) return undefined;
}

interface UpdateStatusBody {
  status: ApplicationPayload['status'];
}

export const useApplicationsApi = () => {
  const { request } = useApiClient();
  const { execute, error, isLoading, resetError } = useApiHandler();

  const createApplication = useCallback(
    (payload: ApplicationPayload) =>
      execute(() =>
        request<ApplicationResponseDto, ApplicationPayload>('/api/applications', {
          method: 'POST',
          body: payload,
        }),
      ),
    [execute, request],
  );

  const getApplicationById = useCallback(
    (id: number) => execute(() => request<ApplicationResponseDto>(`/api/applications/${id}`)),
    [execute, request],
  );

  const listApplications = useCallback(
    (filters?: ApplicationFilters) =>
      execute(() =>
        request<ApplicationResponseDto[]>('/api/applications', {
          query: toQueryRecord(filters),
        }),
      ),
    [execute, request],
  );

  const updateApplicationStatus = useCallback(
    (id: number, status: ApplicationPayload['status']) =>
      execute(() =>
        request<ApplicationResponseDto, UpdateStatusBody>(`/api/applications/${id}/status`, {
          method: 'PATCH',
          body: { status },
        }),
      ),
    [execute, request],
  );

  const deleteApplication = useCallback(
    (id: number) =>
      execute(() =>
        request<void>(`/api/applications/${id}`, {
          method: 'DELETE',
        }),
      ),
    [execute, request],
  );

  return {
    isLoading,
    error,
    resetError,
    createApplication,
    getApplicationById,
    listApplications,
    updateApplicationStatus,
    deleteApplication,
  };
};

