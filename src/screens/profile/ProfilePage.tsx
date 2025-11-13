import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { Switch } from '../../components/ui/Switch';
import { useAuth } from '../../contexts/AuthContext';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { theme } from '../../styles/theme';
import { useTranslation } from 'react-i18next';
import { useAnnouncementsApi } from '../../hooks/api/useAnnouncementsApi';
import { useApplicationsApi } from '../../hooks/api/useApplicationsApi';
import { useRatingsApi } from '../../hooks/api/useRatingsApi';
import { RatingDto } from '../../types/api';

type ActivityReview = RatingDto & { note?: number; commentaire?: string; dateAvis?: string };

interface ProfilePageProps {
  onNavigate?: (page: string) => void;
}

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { user, logout, isAuthenticated, accessToken } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { t } = useTranslation();
  const { listAnnouncementsByOwner } = useAnnouncementsApi();
  const { listApplications } = useApplicationsApi();
  const { getAverageRating, getRatingCount, getRatingsReceived } = useRatingsApi();
  
  const [listingsCreated, setListingsCreated] = useState(0);
  const [guardsCompleted, setGuardsCompleted] = useState(0);
  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [recentReviews, setRecentReviews] = useState<ActivityReview[]>([]);

  const normalizeRating = (
    rating: RatingDto & { note?: number; commentaire?: string; dateAvis?: string },
  ): ActivityReview => ({
    ...rating,
    score: rating.score ?? rating.note ?? 0,
    comment: rating.comment ?? rating.commentaire ?? '',
    createdAt: rating.createdAt ?? rating.dateAvis ?? '',
    updatedAt: rating.updatedAt ?? rating.dateAvis ?? '',
  });

  const formatDate = (value?: string) => {
    if (!value) {
      return 'Date inconnue';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'Date inconnue';
    }
    return parsed.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };
  
  useEffect(() => {
    const fetchUserStats = async () => {
      // Ne charger que si l'utilisateur est authentifié avec un token valide
      if (!isAuthenticated || !user?.username || !accessToken) {
        return;
      }

      try {
        // Fetch announcements count
        const announcements = await listAnnouncementsByOwner(user.username);
        if (announcements) {
          setListingsCreated(announcements.length);
        }

        // Fetch completed guards/applications count
        const applications = await listApplications({ guardianUsername: user.username });
        if (applications) {
          const completed = applications.filter(app => app.status === 'ACCEPTED');
          setGuardsCompleted(completed.length);
        }

        // Fetch average rating
        const avgRating = await getAverageRating(user.username);
        if (avgRating !== null && avgRating !== undefined) {
          setRating(Number(avgRating.toFixed(1)));
        }

        // Fetch review count
        const count = await getRatingCount(user.username);
        if (count !== null && count !== undefined) {
          setReviewCount(count);
        }

        // Fetch recent reviews
        const received = await getRatingsReceived(user.username, { limit: 3, page: 0 });
        if (received?.content) {
          setRecentReviews(received.content.map((item) => normalizeRating(item)));
        } else {
          setRecentReviews([]);
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    fetchUserStats();
  }, [
    user?.username,
    user?.id,
    listAnnouncementsByOwner,
    listApplications,
    getAverageRating,
    getRatingCount,
    getRatingsReceived,
    isAuthenticated,
    accessToken,
  ]);

  const userStats = {
    listingsCreated: listingsCreated,
    guardsCompleted: guardsCompleted,
    rating: rating,
    reviewCount: reviewCount,
  };

  const menuItems = [
    {
      icon: "Home",
      label: "Mes annonces",
      description: "Gérer vos demandes de garde",
      count: userStats.listingsCreated,
      action: () => onNavigate?.("my-listings")
    },
    {
      icon: "Clock",
      label: "Mes gardes",
      description: "Vos gardes passées et à venir",
      count: userStats.guardsCompleted,
      action: () => onNavigate?.("guard-history")
    },
    {
      icon: "Star",
      label: "Mes avis",
      description: "Évaluations reçues et données",
      count: userStats.reviewCount,
      action: () => onNavigate?.("reviews")
    }
  ];

  const settingsItems = [
    {
      icon: "Star",
      label: "Abonnement",
      description: "Plan Gratuit - Passer au Premium",
      badge: "Gratuit",
      action: () => onNavigate?.("subscription")
    },
    {
      icon: "Bell",
      label: "Notifications",
      description: "Gérer vos préférences",
      hasSwitch: true,
      enabled: true
    },
    {
      icon: "ShieldCheckmark",
      label: "Vérification d'identité",
      description: user?.isVerified ? "Complétée" : "En attente de vérification",
      badge: user?.isVerified ? "Vérifié" : "En attente"
    },
    {
      icon: "CreditCard",
      label: "Paiements",
      description: "Cartes et facturation",
      action: () => onNavigate?.("payments")
    }
  ];

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Profil"
        icon="person"
        rightButton={{
          icon: "Settings",
          onPress: () => onNavigate?.("edit-profile")
        }}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              {user?.photo_profil ? (
                <ImageWithFallback
                  source={{ uri: user.photo_profil }}
                  style={styles.avatarImage}
                  fallbackIcon="User"
                />
              ) : (
                <Icon name="User" size={32} color={theme.colors.mutedForeground} />
              )}
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{user?.fullName || user?.username || 'Utilisateur'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <Text style={styles.memberSince}>
                Membre depuis {user?.date_inscription ? new Date(user.date_inscription).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'janvier 2023'}
              </Text>
              <View style={styles.profileMeta}>
                <View style={styles.ratingContainer}>
                  <Icon name="Star" size={16} color="#fbbf24" />
                  <Text style={styles.ratingText}>{userStats.rating}</Text>
                  <Text style={styles.reviewCount}>({userStats.reviewCount} avis)</Text>
                </View>
                {user?.isVerified && (
                  <Badge variant="secondary" style={styles.verifiedBadge}>
                    <Icon name="ShieldCheckmark" size={12} color={theme.colors.secondaryForeground} />
                    <Text style={styles.verifiedText}>Vérifiée</Text>
                  </Badge>
                )}
              </View>
            </View>
          </View>

          {/* Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.listingsCreated}</Text>
              <Text style={styles.statLabel}>Annonces</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.guardsCompleted}</Text>
              <Text style={styles.statLabel}>Gardes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.rating}</Text>
              <Text style={styles.statLabel}>Note moyenne</Text>
            </View>
          </View>

        <View style={styles.content}>
          {/* My Activities */}
          <Card style={styles.sectionCard}>
            <CardContent>
              <Text style={styles.sectionTitle}>Mes activités</Text>
              <View style={styles.menuList}>
                {menuItems.map((item, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.menuItem}
                    onPress={item.action}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={styles.menuIcon}>
                        <Icon name={item.icon as any} size={20} color={theme.colors.primary} />
                      </View>
                      <View style={styles.menuItemContent}>
                        <Text style={styles.menuItemTitle}>{item.label}</Text>
                        <Text style={styles.menuItemDescription}>{item.description}</Text>
                      </View>
                    </View>
                    <View style={styles.menuItemRight}>
                      {item.count && (
                        <Badge variant="secondary" style={styles.countBadge}>
                          {item.count}
                        </Badge>
                      )}
                      <Icon name="ChevronRight" size={16} color={theme.colors.mutedForeground} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card style={styles.sectionCard}>
            <CardContent>
              <Text style={styles.sectionTitle}>Paramètres</Text>
              <View style={styles.menuList}>
                {settingsItems.map((item, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.menuItem}
                    onPress={item.action}
                    disabled={!item.action}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={styles.settingsIcon}>
                        <Icon name={item.icon as any} size={20} color={theme.colors.mutedForeground} />
                      </View>
                      <View style={styles.menuItemContent}>
                        <Text style={styles.menuItemTitle}>{item.label}</Text>
                        <Text style={styles.menuItemDescription}>{item.description}</Text>
                      </View>
                    </View>
                    <View style={styles.menuItemRight}>
                      {item.badge && (
                        <Badge 
                          variant="outline" 
                  style={item.badge === "Gratuit" ? 
                    StyleSheet.flatten([styles.settingsBadge, styles.freeBadge]) : 
                    StyleSheet.flatten([styles.settingsBadge, styles.verifiedSettingsBadge])
                  }
                        >
                          {item.badge}
                        </Badge>
                      )}
                      {item.hasSwitch ? (
                        <Switch 
                          value={notificationsEnabled} 
                          onValueChange={setNotificationsEnabled}
                        />
                      ) : (
                        <Icon name="ChevronRight" size={16} color={theme.colors.mutedForeground} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Support */}
          <Card style={styles.sectionCard}>
            <CardContent>
              <Text style={styles.sectionTitle}>Support</Text>
              <View style={styles.menuList}>
                <View style={styles.menuItem}>
                  <View style={styles.menuItemLeft}>
                    <View style={styles.settingsIcon}>
                      <Icon name="Settings" size={20} color={theme.colors.mutedForeground} />
                    </View>
                    <View style={styles.menuItemContent}>
                      <Text style={styles.menuItemTitle}>Centre d'aide</Text>
                      <Text style={styles.menuItemDescription}>FAQ et assistance</Text>
                    </View>
                  </View>
                  <Icon name="ChevronRight" size={16} color={theme.colors.mutedForeground} />
                </View>
                
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => onNavigate?.("advanced-settings")}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.settingsIcon}>
                      <Icon name="Settings" size={20} color={theme.colors.mutedForeground} />
                    </View>
                    <View style={styles.menuItemContent}>
                      <Text style={styles.menuItemTitle}>{t('settings.advancedTitle')}</Text>
                      <Text style={styles.menuItemDescription}>{t('settings.advancedDescription')}</Text>
                    </View>
                  </View>
                  <Icon name="ChevronRight" size={16} color={theme.colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card style={styles.sectionCard}>
            <CardContent>
              <Text style={styles.sectionTitle}>Activité récente</Text>
              <View style={styles.activityList}>
                {recentReviews.length > 0 ? (
                  recentReviews.map((review) => {
                    const score = typeof review.score === 'number' ? review.score : 0;
                    const displayDate = formatDate(review.createdAt);
                    return (
                      <View key={review.id} style={styles.activityItem}>
                        <View style={[styles.activityIcon, { backgroundColor: '#dbeafe' }]}>
                          <Icon name="Star" size={16} color="#2563eb" />
                        </View>
                        <View style={styles.activityContent}>
                          <Text style={styles.activityTitle}>
                            {score.toFixed(1)} étoiles de {review.authorId}
                          </Text>
                          <Text style={styles.activityDescription}>
                            Reçu le {displayDate}
                          </Text>
                          {review.comment ? (
                            <Text style={styles.activityComment}>{review.comment}</Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.activityItem}>
                    <View style={[styles.activityIcon, { backgroundColor: '#f1f5f9' }]}>
                      <Icon name="help-circle" size={16} color={theme.colors.mutedForeground} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>Aucun avis pour le moment</Text>
                      <Text style={styles.activityDescription}>
                        Vos avis reçus apparaîtront ici dès qu&apos;un client vous évaluera.
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </CardContent>
          </Card>

          {/* Logout */}
          <Card style={styles.sectionCard}>
            <CardContent>
              <Button 
                variant="ghost" 
                style={styles.logoutButton}
                onPress={logout}
              >
                <Icon name="log-out" size={20} color={theme.colors.destructive} />
                <Text style={styles.logoutText}>Se déconnecter</Text>
              </Button>
            </CardContent>
          </Card>

          {/* Version */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>GuardHome v1.2.0</Text>
          </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    position: 'relative',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
  },
  editButton: {
    position: 'absolute',
    right: 0,
    padding: theme.spacing.sm,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.xs,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  memberSince: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.sm,
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  ratingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  reviewCount: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  verifiedText: {
    fontSize: theme.fontSize.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
    paddingBottom: 100,
  },
  sectionCard: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.lg,
  },
  menuList: {
    gap: theme.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'transparent',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  menuItemDescription: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  countBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  settingsBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  freeBadge: {
    borderColor: '#fed7aa',
    backgroundColor: '#fef3e2',
  },
  verifiedSettingsBadge: {
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  activityList: {
    gap: theme.spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.muted + '30',
    borderRadius: theme.borderRadius.lg,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  activityDescription: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  activityComment: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.foreground,
    marginTop: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing.md,
    width: '100%',
  },
  logoutText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.destructive,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  versionText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
});
