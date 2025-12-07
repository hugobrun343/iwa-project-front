import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Alert } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { Textarea } from '../../components/ui/Textarea';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useApplicationsApi } from '../../hooks/api/useApplicationsApi';
import { useAnnouncementsApi } from '../../hooks/api/useAnnouncementsApi';
import { useRatingsApi } from '../../hooks/api/useRatingsApi';
import { useUserApi } from '../../hooks/api/useUserApi';
import { ApplicationResponseDto, AnnouncementResponseDto, RatingDto } from '../../types/api';
import { useTranslation } from 'react-i18next';

interface GuardHistoryPageProps {
  onBack: () => void;
}

interface GuardData {
  id: string;
  title: string;
  location: string;
  period: string;
  duration: string;
  owner: string;
  ownerUsername?: string;
  ownerAvatar?: string;
  payment: number;
  rating?: number;
  review?: string;
  animals: string[];
  plants: string[];
  photos?: number;
  status?: string;
  daysLeft?: number;
  announcementId: number;
  ratingGiven?: boolean;
  ratingId?: number;
}

export function GuardHistoryPage({ onBack }: GuardHistoryPageProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("current");
  const { user } = useAuth();
  const { listApplications } = useApplicationsApi();
  const { getAnnouncementById } = useAnnouncementsApi();
  const { getRatingsReceived, getRatingsGiven, createRating, updateRating } = useRatingsApi();
  const { getUserByUsername } = useUserApi();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedGuard, setSelectedGuard] = useState<GuardData | null>(null);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [guardHistory, setGuardHistory] = useState<{
    completed: GuardData[];
    upcoming: GuardData[];
    current: GuardData[];
  }>({
    completed: [],
    upcoming: [],
    current: [],
  });

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPeriod = (startDate: string, endDate?: string): string => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;
    const startStr = start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const endStr = end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  const calculateDuration = (startDate: string, endDate?: string): string => {
    if (!endDate) return t('common.days', { count: 1 });
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return t(diffDays === 1 ? 'common.days' : 'common.days_plural', { count: diffDays });
  };

  const calculateDaysLeft = (endDate: string): number => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const parseCareType = (careTypeLabel: string): { animals: string[]; plants: string[] } => {
    const animals: string[] = [];
    const plants: string[] = [];
    
    const lowerLabel = careTypeLabel.toLowerCase();
    if (lowerLabel.includes('chat') || lowerLabel.includes('cat')) {
      const match = careTypeLabel.match(/(\d+)\s*chat/i);
      const count = match ? match[1] : '1';
      animals.push(`${count} chat${count !== '1' ? 's' : ''}`);
    }
    if (lowerLabel.includes('chien') || lowerLabel.includes('dog')) {
      const match = careTypeLabel.match(/(\d+)\s*chien/i);
      const count = match ? match[1] : '1';
      animals.push(`${count} chien${count !== '1' ? 's' : ''}`);
    }
    if (lowerLabel.includes('poisson') || lowerLabel.includes('fish')) {
      animals.push('Poissons');
    }
    if (lowerLabel.includes('plante') || lowerLabel.includes('plant')) {
      plants.push('Plantes');
    }
    
    return { animals, plants };
  };

  const fetchGuardHistory = useCallback(async () => {
    if (!user?.username) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

        // Fetch all applications for the current user as guardian
        const applications = await listApplications({ guardianUsername: user.username });
        
        console.log('Total applications found:', applications?.length || 0);
        
        if (!applications || applications.length === 0) {
          setGuardHistory({ completed: [], upcoming: [], current: [] });
          setIsLoading(false);
          return;
        }

        // Filter only ACCEPTED applications
        const acceptedApplications = applications.filter(app => app.status === 'ACCEPTED');
        console.log('Accepted applications:', acceptedApplications.length);

        // Fetch announcement details and owner info for each application
        const guardDataPromises = acceptedApplications.map(async (app: ApplicationResponseDto) => {
          try {
            console.log(`Processing application ${app.id} for announcement ${app.announcementId}`);
            let announcement;
            try {
              announcement = await getAnnouncementById(app.announcementId);
            } catch (err) {
              console.error(`Failed to fetch announcement ${app.announcementId} for application ${app.id}:`, err);
              // Continue with minimal data if announcement fetch fails
              return {
                guardData: {
                  id: app.id.toString(),
                  title: `Annonce #${app.announcementId}`,
                  location: 'Non disponible',
                  period: app.createdAt ? formatDate(app.createdAt) : 'Date inconnue',
                  duration: 'Non disponible',
                  owner: 'Non disponible',
                  ownerAvatar: undefined,
                  payment: 0,
                  animals: [],
                  plants: [],
                  photos: 0,
                  status: 'completed',
                  announcementId: app.announcementId,
                },
                status: 'completed' as const,
              };
            }
            
            if (!announcement) {
              console.warn(`Announcement ${app.announcementId} not found for application ${app.id}`);
              // Return minimal data instead of null
              return {
                guardData: {
                  id: app.id.toString(),
                  title: `Annonce #${app.announcementId}`,
                  location: 'Non disponible',
                  period: app.createdAt ? formatDate(app.createdAt) : 'Date inconnue',
                  duration: 'Non disponible',
                  owner: 'Non disponible',
                  ownerAvatar: undefined,
                  payment: 0,
                  animals: [],
                  plants: [],
                  photos: 0,
                  status: 'completed',
                  announcementId: app.announcementId,
                },
                status: 'completed' as const,
              };
            }
            
            console.log(`Announcement ${app.announcementId} found:`, {
              title: announcement.title,
              status: announcement.status,
              startDate: announcement.startDate,
              endDate: announcement.endDate,
            });

            // Fetch owner info
            let ownerInfo = null;
            if (announcement.ownerUsername) {
              try {
                ownerInfo = await getUserByUsername(announcement.ownerUsername);
              } catch (err) {
                console.warn(`Failed to fetch owner info for ${announcement.ownerUsername}:`, err);
              }
            }

            const now = new Date();
            let startDate: Date | null = null;
            let endDate: Date | null = null;
            
            try {
              if (announcement.startDate) {
                startDate = new Date(announcement.startDate);
                if (isNaN(startDate.getTime())) {
                  console.warn(`Invalid startDate for announcement ${app.announcementId}: ${announcement.startDate}`);
                  startDate = null;
                }
              }
              if (announcement.endDate) {
                endDate = new Date(announcement.endDate);
                if (isNaN(endDate.getTime())) {
                  console.warn(`Invalid endDate for announcement ${app.announcementId}: ${announcement.endDate}`);
                  endDate = null;
                }
              }
            } catch (err) {
              console.warn(`Error parsing dates for announcement ${app.announcementId}:`, err);
            }

            // Determine status based on announcement status and dates
            let status: 'current' | 'upcoming' | 'completed' = 'completed';
            
            // If announcement is marked as COMPLETED, it's definitely completed
            if (announcement.status === 'COMPLETED') {
              status = 'completed';
              console.log(`Announcement ${app.announcementId} marked as COMPLETED`);
            } else if (endDate && startDate) {
              // If we have both dates, use them to determine status
              if (endDate < now) {
                // End date has passed - guard is completed
                status = 'completed';
                console.log(`Announcement ${app.announcementId}: endDate passed, status=completed`);
              } else if (startDate > now) {
                // Start date is in the future - guard is upcoming
                status = 'upcoming';
                console.log(`Announcement ${app.announcementId}: startDate in future, status=upcoming`);
              } else {
                // We're between start and end date - guard is current
                status = 'current';
                console.log(`Announcement ${app.announcementId}: between dates, status=current`);
              }
            } else if (startDate) {
              // Only start date available
              if (startDate > now) {
                status = 'upcoming';
                console.log(`Announcement ${app.announcementId}: only startDate, in future, status=upcoming`);
              } else {
                // Start date has passed but no end date - consider it current if recent, completed if old
                const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                status = daysSinceStart > 30 ? 'completed' : 'current';
                console.log(`Announcement ${app.announcementId}: only startDate, ${daysSinceStart} days ago, status=${status}`);
              }
            } else {
              // No valid dates - default to completed if old application, current if recent
              const appDate = app.createdAt ? new Date(app.createdAt) : null;
              if (appDate && !isNaN(appDate.getTime())) {
                const daysSinceApp = Math.floor((now.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24));
                status = daysSinceApp > 30 ? 'completed' : 'current';
                console.log(`Announcement ${app.announcementId}: no valid dates, using app date, ${daysSinceApp} days ago, status=${status}`);
              } else {
                status = 'completed';
                console.log(`Announcement ${app.announcementId}: no valid dates at all, defaulting to completed`);
              }
            }

            // Fetch rating if completed - ratings given TO the guardian (user) BY the owner
            let rating: number | undefined;
            let review: string | undefined;
            let ratingGiven = false;
            let ratingId: number | undefined;
            
            if (status === 'completed') {
              try {
                // Get rating received by guardian from owner
                const ratingsReceived = await getRatingsReceived(user.username, { limit: 100, page: 0 });
                if (ratingsReceived?.content) {
                  // Find rating from the owner for this guard
                  const guardRating = ratingsReceived.content.find((r: RatingDto) => 
                    r.authorId === announcement.ownerUsername
                  );
                  if (guardRating) {
                    rating = guardRating.note ?? guardRating.score ?? 0;
                    review = guardRating.commentaire ?? guardRating.comment;
                  }
                }
                
                // Check if guardian has given a rating to the owner
                if (announcement.ownerUsername) {
                  try {
                    const ratingsGiven = await getRatingsGiven(user.username, { limit: 100, page: 0 });
                    if (ratingsGiven?.content) {
                      const givenRating = ratingsGiven.content.find((r: RatingDto) => 
                        r.recipientId === announcement.ownerUsername
                      );
                      if (givenRating) {
                        ratingGiven = true;
                        ratingId = givenRating.id;
                      }
                    }
                  } catch (err) {
                    console.warn('Failed to fetch ratings given:', err);
                  }
                }
              } catch (err) {
                console.warn('Failed to fetch ratings:', err);
              }
            }

            const { animals, plants } = parseCareType(announcement.careTypeLabel || '');

            // Format period and duration
            let period = 'Date non disponible';
            let duration = 'Non disponible';
            
            if (startDate && endDate) {
              period = formatPeriod(announcement.startDate!, announcement.endDate!);
              duration = calculateDuration(announcement.startDate!, announcement.endDate!);
            } else if (startDate) {
              period = formatDate(announcement.startDate!);
              duration = 'Date de fin non définie';
            } else if (app.createdAt) {
              period = formatDate(app.createdAt);
              duration = 'Non disponible';
            }

            const guardData: GuardData = {
              id: app.id.toString(),
              title: announcement.title || `Annonce #${announcement.id}`,
              location: announcement.location || 'Non disponible',
              period,
              duration,
              owner: ownerInfo ? `${ownerInfo.firstName || ''} ${ownerInfo.lastName || ''}`.trim() || announcement.ownerUsername || 'Propriétaire' : announcement.ownerUsername || 'Propriétaire',
              ownerUsername: announcement.ownerUsername,
              ownerAvatar: ownerInfo?.profilePhoto,
              payment: announcement.remuneration || 0,
              rating,
              review,
              animals,
              plants,
              photos: announcement.publicImages?.length || 0,
              status: status === 'current' ? 'in_progress' : status === 'upcoming' ? 'confirmed' : 'completed',
              daysLeft: endDate && status === 'current' ? calculateDaysLeft(announcement.endDate!) : undefined,
              announcementId: announcement.id,
              ratingGiven,
              ratingId,
            };
            
            console.log(`Created guardData for application ${app.id}:`, {
              id: guardData.id,
              title: guardData.title,
              status: guardData.status,
              period: guardData.period,
            });

            return { guardData, status };
          } catch (err) {
            console.error(`Error processing application ${app.id}:`, err);
            return null;
          }
        });

        const results = await Promise.all(guardDataPromises);
        const validResults = results.filter(r => r !== null) as Array<{ guardData: GuardData; status: string }>;

        console.log('Valid guard results:', validResults.length);

        const completed: GuardData[] = [];
        const upcoming: GuardData[] = [];
        const current: GuardData[] = [];

        validResults.forEach(({ guardData, status }) => {
          console.log(`Guard ${guardData.id} (${guardData.title}): status=${status}, period=${guardData.period}`);
          if (status === 'completed') {
            completed.push(guardData);
          } else if (status === 'upcoming') {
            upcoming.push(guardData);
          } else {
            current.push(guardData);
          }
        });

        console.log(`Final counts - completed: ${completed.length}, upcoming: ${upcoming.length}, current: ${current.length}`);

        // Sort completed by date (most recent first)
        completed.sort((a, b) => {
          const dateA = new Date(a.period.split(' - ')[1] || a.period);
          const dateB = new Date(b.period.split(' - ')[1] || b.period);
          return dateB.getTime() - dateA.getTime();
        });

        // Sort upcoming by date (soonest first)
        upcoming.sort((a, b) => {
          const dateA = new Date(a.period.split(' - ')[0]);
          const dateB = new Date(b.period.split(' - ')[0]);
          return dateA.getTime() - dateB.getTime();
        });

        setGuardHistory({ completed, upcoming, current });
        
        // Auto-select completed tab if there are completed guards and current tab is empty
        if (completed.length > 0 && current.length === 0 && upcoming.length === 0) {
          setActiveTab('completed');
        }
      } catch (err) {
        console.error('Error fetching guard history:', err);
        setError(t('guardHistory.error'));
      } finally {
        setIsLoading(false);
      }
  }, [user?.username, listApplications, getAnnouncementById, getRatingsReceived, getRatingsGiven, getUserByUsername]);

  useEffect(() => {
    fetchGuardHistory();
  }, [fetchGuardHistory]);

  const handleOpenRatingModal = (guard: GuardData) => {
    setSelectedGuard(guard);
    setRatingScore(0);
    setRatingComment('');
    setRatingModalVisible(true);
  };

  const handleSubmitRating = async () => {
    if (!selectedGuard?.ownerUsername || ratingScore === 0) {
      Alert.alert(t('common.error'), t('guardHistory.modals.errorSelectRating'));
      return;
    }

    if (!user?.username) {
      Alert.alert(t('common.error'), t('guardHistory.modals.errorNotLoggedIn'));
      return;
    }

    try {
      setIsSubmittingRating(true);
      
      if (selectedGuard.ratingId) {
        // Update existing rating
        await updateRating(selectedGuard.ratingId, {
          note: ratingScore,
          commentaire: ratingComment || undefined,
        });
      } else {
        // Create new rating
        await createRating(selectedGuard.ownerUsername, {
          note: ratingScore,
          commentaire: ratingComment || undefined,
        });
      }

      setRatingModalVisible(false);
      setSelectedGuard(null);
      setRatingScore(0);
      setRatingComment('');
      
      // Refresh guard history to show updated rating
      await fetchGuardHistory();
      
      Alert.alert(t('common.success'), t('guardHistory.modals.success'));
    } catch (err) {
      console.error('Error submitting rating:', err);
      Alert.alert(t('common.error'), t('guardHistory.modals.errorSaving'));
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <View style={[styles.badge, styles.completedBadge]}>
            <Text style={styles.completedBadgeText}>{t('guardHistory.badges.completed')}</Text>
          </View>
        );
      case "in_progress":
        return (
          <View style={[styles.badge, styles.inProgressBadge]}>
            <Text style={styles.inProgressBadgeText}>{t('guardHistory.badges.inProgress')}</Text>
          </View>
        );
      case "confirmed":
        return (
          <View style={[styles.badge, styles.confirmedBadge]}>
            <Text style={styles.confirmedBadgeText}>{t('guardHistory.badges.confirmed')}</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const CompletedGuardCard = ({ guard }: { guard: any }) => (
    <Card style={styles.guardCard}>
      <CardContent>
        <View style={styles.cardHeader}>
          <View style={styles.ownerInfo}>
            <View style={styles.avatar}>
              <ImageWithFallback 
                source={guard.ownerAvatar ? { uri: guard.ownerAvatar } : { uri: '' }}
                style={styles.avatarImage}
                fallbackIcon="person"
              />
            </View>
            <View style={styles.guardInfo}>
              <Text style={styles.guardTitle}>{guard.title}</Text>
              <View style={styles.locationRow}>
                <Icon name="location" size={12} color={theme.colors.mutedForeground} />
                <Text style={styles.locationText}>{guard.location}</Text>
              </View>
            </View>
          </View>
          {getStatusBadge("completed")}
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('guardHistory.details.period')}</Text>
            <Text style={styles.detailValue}>{guard.period}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('guardHistory.details.duration')}</Text>
            <Text style={styles.detailValue}>{guard.duration}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('guardHistory.details.payment')}</Text>
            <Text style={[styles.detailValue, styles.paymentText]}>{guard.payment}€</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('guardHistory.details.photos')}</Text>
            <View style={styles.photosRow}>
              <Icon name="camera" size={12} color={theme.colors.mutedForeground} />
              <Text style={styles.detailValue}>{guard.photos}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tagsRow}>
          {guard.animals.length > 0 && (
            <Badge variant="outline" style={styles.animalBadge}>
              {guard.animals.join(', ')}
            </Badge>
          )}
          {guard.plants.length > 0 && (
            <Badge variant="outline" style={styles.plantBadge}>
              {guard.plants.join(', ')}
            </Badge>
          )}
        </View>

        <View style={styles.ratingRow}>
          <View style={styles.starsRow}>
            {[...Array(5)].map((_, i) => (
              <Icon 
                key={i} 
                name="star" 
                size={16} 
                color={i < (guard.rating || 0) ? "#fbbf24" : "#d1d5db"} 
              />
            ))}
            <Text style={styles.ownerText}>par {guard.owner}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {!guard.ratingGiven && (
            <Button 
              variant="outline" 
              size="sm" 
              style={styles.rateButton}
              onPress={() => handleOpenRatingModal(guard)}
            >
              <Icon name="star" size={16} color={theme.colors.foreground} style={styles.buttonIcon} />
              <Text style={styles.buttonText}>{t('guardHistory.actions.rateOwner')}</Text>
            </Button>
          )}
          <Button variant="ghost" size="sm" style={styles.contactButton}>
            <Icon name="chatbubble" size={16} color={theme.colors.foreground} style={styles.buttonIcon} />
            <Text style={styles.contactButtonText}>{t('guardHistory.actions.contact')}</Text>
          </Button>
        </View>

        {guard.review && (
          <View style={styles.reviewContainer}>
            <Text style={styles.reviewText}>"{guard.review}"</Text>
          </View>
        )}
      </CardContent>
    </Card>
  );

  const UpcomingGuardCard = ({ guard }: { guard: any }) => (
    <Card style={styles.guardCard}>
      <CardContent>
        <View style={styles.cardHeader}>
          <View style={styles.ownerInfo}>
            <View style={styles.avatar}>
              <ImageWithFallback 
                source={guard.ownerAvatar ? { uri: guard.ownerAvatar } : { uri: '' }}
                style={styles.avatarImage}
                fallbackIcon="person"
              />
            </View>
            <View style={styles.guardInfo}>
              <Text style={styles.guardTitle}>{guard.title}</Text>
              <View style={styles.locationRow}>
                <Icon name="location" size={12} color={theme.colors.mutedForeground} />
                <Text style={styles.locationText}>{guard.location}</Text>
              </View>
            </View>
          </View>
          {getStatusBadge(guard.status)}
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('guardHistory.details.period')}</Text>
            <Text style={styles.detailValue}>{guard.period}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('guardHistory.details.duration')}</Text>
            <Text style={styles.detailValue}>{guard.duration}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('guardHistory.details.payment')}</Text>
            <Text style={[styles.detailValue, styles.paymentText]}>{guard.payment}€</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('guardHistory.details.owner')}</Text>
            <Text style={styles.detailValue}>{guard.owner}</Text>
          </View>
        </View>

        <View style={styles.tagsRow}>
          {guard.animals.length > 0 && (
            <Badge variant="outline" style={styles.animalBadge}>
              {guard.animals.join(', ')}
            </Badge>
          )}
          {guard.plants.length > 0 && (
            <Badge variant="outline" style={styles.plantBadge}>
              {guard.plants.join(', ')}
            </Badge>
          )}
        </View>

        <View style={styles.actionButtons}>
          <Button variant="outline" size="sm" style={styles.detailsButton}>
            <Icon name="calendar" size={16} color={theme.colors.foreground} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>{t('guardHistory.actions.viewDetails')}</Text>
          </Button>
          <Button variant="ghost" size="sm" style={styles.messageButton}>
            <Icon name="chatbubble" size={16} color={theme.colors.foreground} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>{t('guardHistory.actions.message')}</Text>
          </Button>
        </View>
      </CardContent>
    </Card>
  );

  const CurrentGuardCard = ({ guard }: { guard: any }) => (
    <Card style={StyleSheet.flatten([styles.guardCard, styles.currentGuardCard])}>
      <CardContent>
        <View style={styles.cardHeader}>
          <View style={styles.ownerInfo}>
            <View style={styles.avatar}>
              <ImageWithFallback 
                source={guard.ownerAvatar ? { uri: guard.ownerAvatar } : { uri: '' }}
                style={styles.avatarImage}
                fallbackIcon="person"
              />
            </View>
            <View style={styles.guardInfo}>
              <Text style={styles.guardTitle}>{guard.title}</Text>
              <View style={styles.locationRow}>
                <Icon name="location" size={12} color={theme.colors.mutedForeground} />
                <Text style={styles.locationText}>{guard.location}</Text>
              </View>
            </View>
          </View>
          {getStatusBadge(guard.status)}
        </View>

        <View style={styles.currentGuardAlert}>
          <View style={styles.alertHeader}>
            <Icon name="time" size={16} color={theme.colors.primary} />
            <Text style={styles.alertTitle}>{t('guardHistory.current.alertTitle')}</Text>
          </View>
          <Text style={styles.alertText}>{t('guardHistory.current.daysLeft', { count: guard.daysLeft })}</Text>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('guardHistory.details.period')}</Text>
            <Text style={styles.detailValue}>{guard.period}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('guardHistory.details.payment')}</Text>
            <Text style={[styles.detailValue, styles.paymentText]}>{guard.payment}€</Text>
          </View>
        </View>

        <View style={styles.tagsRow}>
          {guard.animals.length > 0 && (
            <Badge variant="outline" style={styles.animalBadge}>
              {guard.animals.join(', ')}
            </Badge>
          )}
          {guard.plants.length > 0 && (
            <Badge variant="outline" style={styles.plantBadge}>
              {guard.plants.join(', ')}
            </Badge>
          )}
        </View>

        <View style={styles.actionButtons}>
          <Button size="sm" style={styles.addPhotosButton}>
            <Icon name="camera" size={16} color={theme.colors.primaryForeground} style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>{t('guardHistory.actions.addPhotos')}</Text>
          </Button>
          <Button variant="outline" size="sm" style={styles.messageButton}>
            <Icon name="chatbubble" size={16} color={theme.colors.foreground} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>{t('guardHistory.actions.message')}</Text>
          </Button>
        </View>
      </CardContent>
    </Card>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "current":
        return guardHistory.current.length > 0 ? (
          guardHistory.current.map((guard) => (
            <CurrentGuardCard key={guard.id} guard={guard} />
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <Icon name="time" size={48} color={theme.colors.mutedForeground} />
              <Text style={styles.emptyTitle}>{t('guardHistory.empty.noCurrent')}</Text>
              <Text style={styles.emptyText}>
                {t('guardHistory.empty.noCurrentDesc')}
              </Text>
            </CardContent>
          </Card>
        );
      
      case "upcoming":
        return guardHistory.upcoming.length > 0 ? (
          guardHistory.upcoming.map((guard) => (
            <UpcomingGuardCard key={guard.id} guard={guard} />
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <Icon name="calendar" size={48} color={theme.colors.mutedForeground} />
              <Text style={styles.emptyTitle}>{t('guardHistory.empty.noUpcoming')}</Text>
              <Text style={styles.emptyText}>
                {t('guardHistory.empty.noUpcomingDesc')}
              </Text>
            </CardContent>
          </Card>
        );
      
      case "completed":
        return guardHistory.completed.length > 0 ? (
          guardHistory.completed.map((guard) => (
            <CompletedGuardCard key={guard.id} guard={guard} />
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <Icon name="checkmark-circle" size={48} color={theme.colors.mutedForeground} />
              <Text style={styles.emptyTitle}>{t('guardHistory.empty.noCompleted')}</Text>
              <Text style={styles.emptyText}>
                {t('guardHistory.empty.noCompletedDesc')}
              </Text>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  const averageRating = useMemo(() => {
    const ratedGuards = guardHistory.completed.filter(g => g.rating !== undefined);
    if (ratedGuards.length === 0) return 0;
    const sum = ratedGuards.reduce((acc, guard) => acc + (guard.rating || 0), 0);
    return sum / ratedGuards.length;
  }, [guardHistory.completed]);

  const totalEarnings = useMemo(() => {
    return guardHistory.completed.reduce((sum, guard) => sum + guard.payment, 0);
  }, [guardHistory.completed]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <PageHeader
          title={t('guardHistory.title')}
          showBackButton={true}
          onBack={onBack}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t('guardHistory.loading')}</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <PageHeader
          title={t('guardHistory.title')}
          showBackButton={true}
          onBack={onBack}
        />
        <View style={styles.errorContainer}>
          <Icon name="help-circle" size={48} color={theme.colors.destructive} />
          <Text style={styles.errorText}>{error}</Text>
          <Button onPress={() => {
            fetchGuardHistory();
          }} style={styles.retryButton}>
            <Text>{t('guardHistory.retry')}</Text>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title={t('guardHistory.title')}
        showBackButton={true}
        onBack={onBack}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistiques */}
        <Card style={styles.statsCard}>
          <CardContent>
            <Text style={styles.statsTitle}>{t('guardHistory.stats.title')}</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{guardHistory.completed.length}</Text>
                <Text style={styles.statLabel}>{t('guardHistory.stats.completed')}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {totalEarnings}€
                </Text>
                <Text style={styles.statLabel}>{t('guardHistory.stats.totalEarnings')}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {averageRating > 0 ? averageRating.toFixed(1) : '0'}
                </Text>
                <Text style={styles.statLabel}>{t('guardHistory.stats.averageRating')}</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabsList}>
            {[
              { key: "current", label: t('guardHistory.tabs.current') },
              { key: "upcoming", label: t('guardHistory.tabs.upcoming') },
              { key: "completed", label: t('guardHistory.tabs.completed') }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {renderTabContent()}
        </View>
      </ScrollView>

      {/* Rating Modal */}
      <Modal
        visible={ratingModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('guardHistory.modals.rateOwnerTitle')}</Text>
              <TouchableOpacity
                onPress={() => setRatingModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>

            {selectedGuard && (
              <>
                <Text style={styles.modalSubtitle}>{selectedGuard.title}</Text>
                <Text style={styles.modalOwnerText}>{t('guardHistory.modals.owner', { name: selectedGuard.owner })}</Text>

                <View style={styles.ratingInputContainer}>
                  <Text style={styles.ratingLabel}>{t('guardHistory.modals.ratingLabel')}</Text>
                  <View style={styles.ratingStarsInput}>
                    {[...Array(5)].map((_, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => setRatingScore(i + 1)}
                        style={styles.starButton}
                      >
                        <Icon
                          name="star"
                          size={32}
                          color={i < ratingScore ? "#fbbf24" : "#d1d5db"}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  {ratingScore > 0 && (
                    <Text style={styles.ratingScoreText}>{t('guardHistory.modals.ratingScore', { score: ratingScore })}</Text>
                  )}
                </View>

                <View style={styles.commentContainer}>
                  <Text style={styles.commentLabel}>{t('guardHistory.modals.commentLabel')}</Text>
                  <Textarea
                    value={ratingComment}
                    onChangeText={setRatingComment}
                    placeholder={t('guardHistory.modals.commentPlaceholder')}
                    rows={4}
                    style={styles.commentInput}
                  />
                </View>

                <View style={styles.modalActions}>
                  <Button
                    variant="outline"
                    onPress={() => setRatingModalVisible(false)}
                    style={styles.modalCancelButton}
                  >
                    <Text>{t('guardHistory.modals.cancel')}</Text>
                  </Button>
                  <Button
                    onPress={handleSubmitRating}
                    disabled={ratingScore === 0 || isSubmittingRating}
                    style={styles.modalSubmitButton}
                  >
                    {isSubmittingRating ? (
                      <ActivityIndicator size="small" color={theme.colors.primaryForeground} />
                    ) : (
                      <Text style={styles.modalSubmitText}>{t('guardHistory.modals.save')}</Text>
                    )}
                  </Button>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  statsCard: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  statsTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  tabsContainer: {
    marginBottom: theme.spacing.xl,
  },
  tabsList: {
    flexDirection: 'row',
    backgroundColor: theme.colors.muted,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  activeTab: {
    backgroundColor: theme.colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    fontWeight: theme.fontWeight.medium,
  },
  activeTabText: {
    color: theme.colors.foreground,
  },
  tabContent: {
    paddingBottom: 100,
  },
  guardCard: {
    marginBottom: theme.spacing.lg,
  },
  currentGuardCard: {
    borderColor: `${theme.colors.primary}30`,
    backgroundColor: `${theme.colors.primary}05`,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  ownerInfo: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  guardInfo: {
    flex: 1,
  },
  guardTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  locationText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  completedBadge: {
    borderColor: '#dcfce7',
    backgroundColor: '#f0fdf4',
  },
  completedBadgeText: {
    color: '#16a34a',
    fontSize: theme.fontSize.xs,
  },
  inProgressBadge: {
    borderColor: '#dbeafe',
    backgroundColor: '#eff6ff',
  },
  inProgressBadgeText: {
    color: '#2563eb',
    fontSize: theme.fontSize.xs,
  },
  confirmedBadge: {
    borderColor: '#fed7aa',
    backgroundColor: '#fff7ed',
  },
  confirmedBadgeText: {
    color: '#ea580c',
    fontSize: theme.fontSize.xs,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  detailItem: {
    width: '45%',
  },
  detailLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.xs,
  },
  detailValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  paymentText: {
    fontWeight: theme.fontWeight.medium,
  },
  photosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  animalBadge: {
    borderColor: '#d1d5db',
  },
  plantBadge: {
    borderColor: '#d1d5db',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  ownerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginLeft: theme.spacing.sm,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  contactButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  reviewContainer: {
    backgroundColor: `${theme.colors.muted}30`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  reviewText: {
    fontSize: theme.fontSize.sm,
    fontStyle: 'italic',
    color: theme.colors.foreground,
  },
  currentGuardAlert: {
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  alertTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
  },
  alertText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  detailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  addPhotosButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  buttonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  primaryButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primaryForeground,
  },
  buttonIcon: {
    marginRight: theme.spacing.xs,
  },
  emptyCard: {
    padding: theme.spacing.xl,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: theme.spacing.md,
  },
  rateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
  },
  modalCloseButton: {
    padding: theme.spacing.xs,
  },
  modalSubtitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  modalOwnerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.lg,
  },
  ratingInputContainer: {
    marginBottom: theme.spacing.lg,
  },
  ratingLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
    fontWeight: theme.fontWeight.medium,
  },
  ratingStarsInput: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  starButton: {
    padding: theme.spacing.xs,
  },
  ratingScoreText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  commentContainer: {
    marginBottom: theme.spacing.lg,
  },
  commentLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
    fontWeight: theme.fontWeight.medium,
  },
  commentInput: {
    marginBottom: 0,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  modalCancelButton: {
    flex: 1,
  },
  modalSubmitButton: {
    flex: 1,
  },
  modalSubmitText: {
    color: theme.colors.primaryForeground,
  },
});
