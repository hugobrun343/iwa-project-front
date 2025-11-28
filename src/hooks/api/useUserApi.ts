import { useCallback } from 'react';
import { useApiClient } from './useApiClient';
import { useApiHandler } from './useApiHandler';
import {
  CreateUserPayload,
  LabelDto,
  PrivateUserDto,
  ProfileCompleteResponse,
  PublicUserDto,
  UserExistsResponse,
  UserLanguageDto,
  UserSpecialisationDto,
} from '../../types/api';

interface UpdateLanguagesPayload {
  languages: string[];
}

interface UpdateSpecialisationsPayload {
  specialisations: string[];
}

export const useUserApi = () => {
  const { request } = useApiClient();
  const { execute, error, isLoading, resetError } = useApiHandler();

  const createUser = useCallback(
    (payload: CreateUserPayload) =>
      execute(() =>
        request<PrivateUserDto, CreateUserPayload>('/api/users', {
          method: 'POST',
          body: payload,
        }),
      ),
    [execute, request],
  );

  const checkUserExists = useCallback(
    (username: string) =>
      execute(() =>
        request<UserExistsResponse>('/api/users/exists', {
          query: { username },
        }),
      ),
    [execute, request],
  );

  const getMyProfile = useCallback(
    () => execute(() => request<PrivateUserDto>('/api/users/me')),
    [execute, request],
  );

  const getUserByUsername = useCallback(
    (username: string) => execute(() => request<PublicUserDto>(`/api/users/${username}`)),
    [execute, request],
  );

  const updateMyProfile = useCallback(
    (updates: Partial<CreateUserPayload>) =>
      execute(() =>
        request<PrivateUserDto, Partial<CreateUserPayload>>('/api/users/me', {
          method: 'PATCH',
          body: updates,
        }),
      ),
    [execute, request],
  );

  const getLanguages = useCallback(
    () => execute(() => request<LabelDto[]>('/api/languages')),
    [execute, request],
  );

  const getSpecialisations = useCallback(
    () => execute(() => request<LabelDto[]>('/api/specialisations')),
    [execute, request],
  );

  const getMyLanguages = useCallback(
    () => execute(() => request<UserLanguageDto[]>('/api/users/me/languages')),
    [execute, request],
  );

  const updateMyLanguages = useCallback(
    (languages: string[]) =>
      execute(() =>
        request<LabelDto[], UpdateLanguagesPayload>('/api/users/me/languages', {
          method: 'PATCH',
          body: { languages },
        }),
      ),
    [execute, request],
  );

  const getMySpecialisations = useCallback(
    () => execute(() => request<UserSpecialisationDto[]>('/api/users/me/specialisations')),
    [execute, request],
  );

  const updateMySpecialisations = useCallback(
    (specialisations: string[]) =>
      execute(() =>
        request<LabelDto[], UpdateSpecialisationsPayload>('/api/users/me/specialisations', {
          method: 'PATCH',
          body: { specialisations },
        }),
      ),
    [execute, request],
  );

  const isProfileComplete = useCallback(
    (username: string) => execute(() => request<ProfileCompleteResponse>(`/api/users/${username}/profile-complete`)),
    [execute, request],
  );

  return {
    isLoading,
    error,
    resetError,
    createUser,
    checkUserExists,
    getMyProfile,
    getUserByUsername,
    updateMyProfile,
    getLanguages,
    getSpecialisations,
    getMyLanguages,
    updateMyLanguages,
    getMySpecialisations,
    updateMySpecialisations,
    isProfileComplete,
  };
};

