import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useRatingsApi } from '../../hooks/api/useRatingsApi';
import { useUserApi } from '../../hooks/api/useUserApi';
import { PublicUserDto, RatingDto } from '../../types/api';

interface ReviewsPageProps {
  onBack: () => void;
}

type ApiRating = RatingDto & { note?: number; commentaire?: string; dateAvis?: string };
type ReceivedReview = RatingDto & { author?: PublicUserDto; commentaire?: string; dateAvis?: string; note?: number };
type GivenReview = RatingDto & { recipient?: PublicUserDto; commentaire?: string; dateAvis?: string; note?: number };

export function ReviewsPage({ onBack }: ReviewsPageProps) {
  const [activeTab, setActiveTab] = useState<'received' | 'given'>('received');
  const [receivedReviews, setReceivedReviews] = useState<ReceivedReview[]>([]);
  const [givenReviews, setGivenReviews] = useState<GivenReview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const { getRatingsReceived, getRatingsGiven } = useRatingsApi();
  const { getUserByUsername } = useUserApi();

  const tabs = [
    { id: 'received' as const, label: 'Reçus' },
    { id: 'given' as const, label: 'Donnés' },
  ];

  const normalizeRating = (rating: ApiRating): RatingDto => ({
    ...rating,
    score: rating.score ?? rating.note ?? 0,
    comment: rating.comment ?? rating.commentaire ?? '',
    createdAt: rating.createdAt ?? rating.dateAvis ?? '',
    updatedAt: rating.updatedAt ?? rating.dateAvis ?? '',
  });

  const formatReviewDate = (date?: string) => {
    if (!date) {
      return 'Date inconnue';
    }
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return 'Date inconnue';
    }
    return parsed.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDisplayName = (profile?: PublicUserDto, fallback?: string) => {
    if (!profile) {
      return fallback ?? 'Utilisateur';
    }
    const fullName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();
    return fullName || profile.username || fallback || 'Utilisateur';
  };

  const renderAvatar = (photoUrl?: string) => {
    if (photoUrl) {
      return (
        <ImageWithFallback
          source={{ uri: photoUrl }}
          style={styles.avatar}
          fallbackIcon="User"
        />
      );
    }

    return (
      <View style={[styles.avatar, styles.avatarFallback]}>
        <Icon name="User" size={24} color={theme.colors.mutedForeground} />
      </View>
    );
  };

  useEffect(() => {
    if (!user?.username) {
      return;
    }

    const enrichWithUsers = async (
      ratings: ApiRating[],
      type: 'author' | 'recipient',
    ): Promise<ReceivedReview[] | GivenReview[]> => {
      if (ratings.length === 0) {
        return type === 'author'
          ? ([] as ReceivedReview[])
          : ([] as GivenReview[]);
      }

      const key = type === 'author' ? 'authorId' : 'recipientId';
      const uniqueIds = Array.from(new Set(ratings.map((rating) => rating[key]).filter(Boolean)));
      const userMap = new Map<string, PublicUserDto>();

      await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const profile = await getUserByUsername(id);
            if (profile) {
              userMap.set(id, profile);
            }
          } catch (fetchError) {
            console.warn('Impossible de récupérer le profil utilisateur', id, fetchError);
          }
        }),
      );

      if (type === 'author') {
        return ratings.map((rating) => ({
          ...normalizeRating(rating),
          note: rating.note,
          commentaire: rating.commentaire,
          dateAvis: rating.dateAvis,
          author: userMap.get(rating.authorId),
        })) as ReceivedReview[];
      }

      return ratings.map((rating) => ({
        ...normalizeRating(rating),
        note: rating.note,
        commentaire: rating.commentaire,
        dateAvis: rating.dateAvis,
        recipient: userMap.get(rating.recipientId),
      })) as GivenReview[];
    };

    const fetchReviews = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [receivedResponse, givenResponse] = await Promise.all([
          getRatingsReceived(user.username, { limit: 20, page: 0 }),
          getRatingsGiven(user.username, { limit: 20, page: 0 }),
        ]);

        const receivedContent = receivedResponse?.content ?? [];
        const givenContent = givenResponse?.content ?? [];

        const [receivedEnriched, givenEnriched] = await Promise.all([
          enrichWithUsers(receivedContent, 'author'),
          enrichWithUsers(givenContent, 'recipient'),
        ]);

        setReceivedReviews(receivedEnriched as ReceivedReview[]);
        setGivenReviews(givenEnriched as GivenReview[]);
      } catch (fetchError) {
        console.error('Erreur lors du chargement des avis:', fetchError);
        setError("Impossible de charger les avis. Veuillez réessayer plus tard.");
        setReceivedReviews([]);
        setGivenReviews([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [user?.username, getRatingsReceived, getRatingsGiven, getUserByUsername]);

  const averageRating = useMemo(() => {
    if (receivedReviews.length === 0) {
      return '0.0';
    }
    const sum = receivedReviews.reduce((total, review) => total + (review.score ?? review.note ?? 0), 0);
    return (sum / receivedReviews.length).toFixed(1);
  }, [receivedReviews]);

  const ReceivedReviewCard = ({ review }: { review: ReceivedReview }) => (
    <Card style={styles.card}>
      <CardContent style={styles.cardContent}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewerInfo}>
            {renderAvatar(review.author?.profilePhoto)}
            <View style={styles.reviewerDetails}>
              <Text style={styles.reviewerName}>
                {getDisplayName(review.author, review.authorId)}
              </Text>
              <Text style={styles.reviewDate}>
                Reçu le {formatReviewDate(review.createdAt || review.dateAvis)}
              </Text>
            </View>
          </View>
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {[...Array(5)].map((_, i) => (
                <Icon 
                  key={i} 
                  name="star" 
                  size={16} 
                  color={i < (review.score ?? 0) ? "#fbbf24" : "#d1d5db"}
                />
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.reviewComment}>
          {review.comment || review.commentaire || "Aucun commentaire fourni."}
        </Text>
      </CardContent>
    </Card>
  );

  const GivenReviewCard = ({ review }: { review: GivenReview }) => (
    <Card style={styles.card}>
      <CardContent style={styles.cardContent}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewerInfo}>
            {renderAvatar(review.recipient?.profilePhoto)}
            <View style={styles.reviewerDetails}>
              <Text style={styles.reviewerName}>
                {getDisplayName(review.recipient, review.recipientId)}
              </Text>
              <Text style={styles.reviewDate}>
                Donné le {formatReviewDate(review.createdAt || review.dateAvis)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.givenRating}>
          <Text style={styles.ratingLabel}>Votre évaluation :</Text>
          <View style={styles.starsContainer}>
            {[...Array(5)].map((_, i) => (
              <Icon 
                key={i} 
                name="star" 
                size={16} 
                color={i < (review.score ?? review.note ?? 0) ? "#fbbf24" : "#d1d5db"}
              />
            ))}
          </View>
        </View>

        <Text style={styles.reviewComment}>
          {review.comment || review.commentaire || "Aucun commentaire ajouté."}
        </Text>

        <View style={styles.reviewActions}>
          <Button variant="ghost" size="sm" style={styles.actionButton}>
            <Icon name="create" size={16} color={theme.colors.primary} />
            <Text style={styles.actionText}>Modifier</Text>
          </Button>
        </View>
      </CardContent>
    </Card>
  );

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement des avis…</Text>
        </View>
      );
    }

    if (error) {
      return (
        <Card style={styles.emptyCard}>
          <CardContent style={styles.emptyContent}>
            <Icon name="help-circle" size={48} color={theme.colors.destructive} />
            <Text style={styles.emptyTitle}>Impossible de charger les avis</Text>
            <Text style={styles.emptyText}>{error}</Text>
          </CardContent>
        </Card>
      );
    }

    switch (activeTab) {
      case 'received':
        return receivedReviews.length > 0 ? (
          receivedReviews.map((review) => (
            <ReceivedReviewCard key={review.id} review={review} />
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <Icon name="Star" size={48} color={theme.colors.mutedForeground} />
              <Text style={styles.emptyTitle}>Aucun avis reçu</Text>
              <Text style={styles.emptyText}>
                Les avis de vos clients apparaîtront ici après vos premières gardes.
              </Text>
            </CardContent>
          </Card>
        );
      case 'given':
        return givenReviews.length > 0 ? (
          givenReviews.map((review) => (
            <GivenReviewCard key={review.id} review={review} />
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <CardContent style={styles.emptyContent}>
              <Icon name="create" size={48} color={theme.colors.mutedForeground} />
              <Text style={styles.emptyTitle}>Aucun avis donné</Text>
              <Text style={styles.emptyText}>
                Vos évaluations des propriétaires apparaîtront ici.
              </Text>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Mes avis"
        showBackButton={true}
        onBack={onBack}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Statistiques rapides */}
        <Card style={styles.statsCard}>
          <CardContent style={styles.statsContent}>
            <Text style={styles.statsTitle}>Votre réputation</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {isLoading ? '--' : averageRating}
                </Text>
                <Text style={styles.statLabel}>Note moyenne</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{isLoading ? '--' : receivedReviews.length}</Text>
                <Text style={styles.statLabel}>Avis reçus</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{isLoading ? '--' : givenReviews.length}</Text>
                <Text style={styles.statLabel}>Avis donnés</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabsList}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  activeTab === tab.id && styles.activeTab
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content */}
        <View style={styles.tabContent}>
          {renderTabContent()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  scrollView: {
    flex: 1,
  },
  statsCard: {
    margin: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  statsContent: {
    padding: theme.spacing.lg,
  },
  statsTitle: {
    fontSize: theme.fontSize.md,
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
  statNumber: {
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
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  tabsList: {
    flexDirection: 'row',
    backgroundColor: theme.colors.muted,
    borderRadius: theme.borderRadius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  activeTab: {
    backgroundColor: theme.colors.background,
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
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120, // Space for bottom nav
  },
  loadingContainer: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  card: {
    marginBottom: theme.spacing.lg,
  },
  cardContent: {
    padding: theme.spacing.lg,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  reviewerName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  reviewDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  verifiedText: {
    fontSize: theme.fontSize.xs,
    color: '#22c55e',
  },
  roleBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.muted,
  },
  roleText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  listingInfo: {
    marginBottom: theme.spacing.md,
  },
  listingTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
  },
  givenRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  ratingLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  reviewComment: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  actionText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
  },
  emptyCard: {
    padding: theme.spacing.xl,
  },
  emptyContent: {
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
});