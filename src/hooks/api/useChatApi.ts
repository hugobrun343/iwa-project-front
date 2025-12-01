import { useCallback } from 'react';
import { useApiClient } from './useApiClient';
import { useApiHandler } from './useApiHandler';
import {
  DiscussionDto,
  DiscussionLookupParams,
  DiscussionMessagePayload,
  DiscussionQueryParams,
  MessageCreatePayload,
  MessageDto,
  MessagesQueryParams,
  PaginatedResponse,
} from '../../types/api';

export const useChatApi = () => {
  const { request } = useApiClient();
  const { execute, error, isLoading, resetError } = useApiHandler();

  const getMyDiscussions = useCallback(
    (params?: DiscussionQueryParams) =>
      execute(() =>
        request<PaginatedResponse<DiscussionDto>>('/api/me/discussions', {
          query: params,
        }),
      ),
    [execute, request],
  );

  const findDiscussion = useCallback(
    (params: DiscussionLookupParams) =>
      execute(() =>
        request<DiscussionDto | null>('/api/discussions', {
          query: params,
        }),
      ),
    [execute, request],
  );

  const getDiscussionById = useCallback(
    (id: number) => execute(() => request<DiscussionDto>(`/api/discussions/${id}`)),
    [execute, request],
  );

  const getDiscussionMessages = useCallback(
    (id: number, params?: MessagesQueryParams) =>
      execute(() =>
        request<PaginatedResponse<MessageDto>>(`/api/discussions/${id}/messages`, {
          query: params,
        }),
      ),
    [execute, request],
  );

  const createMessage = useCallback(
    (payload: MessageCreatePayload) =>
      execute(() =>
        request<MessageDto, MessageCreatePayload>('/api/messages', {
          method: 'POST',
          body: payload,
        }),
      ),
    [execute, request],
  );

  const sendMessageToDiscussion = useCallback(
    (id: number, payload: DiscussionMessagePayload) =>
      execute(() =>
        request<MessageDto, DiscussionMessagePayload>(`/api/discussions/${id}/messages`, {
          method: 'POST',
          body: payload,
        }),
      ),
    [execute, request],
  );

  const deleteDiscussion = useCallback(
    (id: number) =>
      execute(() =>
        request<void>(`/api/discussions/${id}`, {
          method: 'DELETE',
        }),
      ),
    [execute, request],
  );

  return {
    isLoading,
    error,
    resetError,
    getMyDiscussions,
    findDiscussion,
    getDiscussionById,
    getDiscussionMessages,
    createMessage,
    sendMessageToDiscussion,
    deleteDiscussion,
  };
};

