export interface UserLanguageDto {
  language: string;
  label?: string; // Keep for backward compatibility
}

export interface UserSpecialisationDto {
  specialisation: string;
  label?: string; // Keep for backward compatibility
}

export interface PrivateUserDto {
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  location?: string;
  description?: string;
  profilePhoto?: string;
  identityVerification?: boolean;
  preferences?: string;
  registrationDate?: string;
  languages?: UserLanguageDto[];
  specialisations?: UserSpecialisationDto[];
}

export interface PublicUserDto {
  username: string;
  firstName?: string;
  lastName?: string;
  location?: string;
  description?: string;
  profilePhoto?: string;
  identityVerification?: boolean;
  registrationDate?: string;
}

export type CreateUserPayload = Omit<PrivateUserDto, 'username' | 'registrationDate' | 'languages' | 'specialisations'>;

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

export interface CareTypeDto {
  id: number;
  label: string;
}

export interface ImageDto {
  id?: number;
  imageUrl?: string;
  imageBlob?: string;
  contentType?: string;
}

export interface AnnouncementPayload {
  ownerUsername: string;
  title: string;
  location: string;
  description: string;
  specificInstructions?: string;
  careTypeLabel: string;
  startDate: string;
  endDate?: string;
  visitFrequency?: string;
  remuneration: number;
  identityVerificationRequired?: boolean;
  urgentRequest?: boolean;
  status?: AnnouncementStatus;
  publicImages?: ImageDto[];
  specificImages?: ImageDto[];
}

export interface AnnouncementResponseDto extends Omit<AnnouncementPayload, 'ownerUsername'> {
  id: number;
  ownerUsername?: string;
  createdAt?: string;
  updatedAt?: string;
  careType?: CareTypeDto;
}

export type AnnouncementStatus = 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED' | 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface ApplicationPayload {
  announcementId: number;
  guardianUsername: string;
  message?: string;
  status: 'SENT' | 'ACCEPTED' | 'REFUSED';
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

