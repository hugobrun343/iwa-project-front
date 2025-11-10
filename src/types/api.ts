export interface PrivateUserDto {
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  location?: string;
  description?: string;
  profilePhoto?: string;
  identityVerification?: string;
  preferences?: Record<string, unknown>;
  registrationDate?: string;
}

export interface PublicUserDto {
  username: string;
  firstName?: string;
  lastName?: string;
  location?: string;
  description?: string;
  profilePhoto?: string;
  identityVerification?: string;
  registrationDate?: string;
}

export type CreateUserPayload = Omit<PrivateUserDto, 'username' | 'registrationDate'>;

export interface UserExistsResponse {
  username: string;
  exists: boolean;
}

export interface ProfileCompleteResponse {
  username: string;
  complete: boolean;
}

export interface LabelDto {
  label: string;
}

export interface AnnouncementPayload {
  title: string;
  description: string;
  requestDate: string;
  hourlyRate: number;
  location: string;
  images?: string[];
  specialisations?: string[];
  status?: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
}

export interface AnnouncementResponseDto extends AnnouncementPayload {
  id: number;
  ownerUsername?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AnnouncementStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface ApplicationPayload {
  announcementId: number;
  guardianUsername: string;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
}

export interface ApplicationResponseDto extends ApplicationPayload {
  id: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DiscussionDto {
  id: number;
  announcementId: number;
  senderId: string;
  recipientId: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageDto {
  id: number;
  discussionId: number;
  authorId: string;
  content: string;
  sentAt: string;
}

export interface FavoriteDto {
  id: number;
  guardianUsername: string;
  announcementId: number;
  createdAt: string;
}

export interface FavoriteCheckResponse {
  isFavorite: boolean;
}

export interface RatingPayload {
  score: number;
  comment?: string;
}

export interface RatingDto extends RatingPayload {
  id: number;
  authorId: string;
  recipientId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface AnnouncementFilters {
  ownerUsername?: string;
  status?: AnnouncementStatus;
}

export interface ApplicationFilters {
  announcementId?: number;
  guardianUsername?: string;
  status?: ApplicationPayload['status'];
  page?: number;
  limit?: number;
}

export interface DiscussionQueryParams {
  page?: number;
  limit?: number;
}

export interface DiscussionLookupParams {
  announcementId: number;
  recipientId: string;
}

export interface MessagesQueryParams {
  page?: number;
  limit?: number;
}

export interface MessageCreatePayload {
  content: string;
  announcementId: number;
  recipientId: string;
}

export interface DiscussionMessagePayload {
  content: string;
  announcementId?: number;
  recipientId?: string;
}

export interface FavoriteCreatePayload {
  announcementId: number;
}

