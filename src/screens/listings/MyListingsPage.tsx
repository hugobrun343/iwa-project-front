import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { Textarea } from '../../components/ui/Textarea';
import { ApplicationsPanel } from '../../components/applications/ApplicationsPanel';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useAnnouncementsApi } from '../../hooks/api/useAnnouncementsApi';
import { useApplicationsApi } from '../../hooks/api/useApplicationsApi';
import { useRatingsApi } from '../../hooks/api/useRatingsApi';
import { useUserApi } from '../../hooks/api/useUserApi';
import { normalizeImageList } from '../../utils/imageUtils';
import { AnnouncementStatus, RatingDto } from '../../types/api';
import { useTranslation } from 'react-i18next';

interface MyListingsPageProps {
  onBack: () => void;
  onCreateListing: () => void;
  onEditListing?: (listingId: string) => void;
}

export function MyListingsPage({ onBack, onCreateListing, onEditListing }: MyListingsPageProps) {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState("active");
  const [userListings, setUserListings] = useState<any>({ active: [], completed: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<{ id: number; title: string } | null>(null);
  const [showApplicationsPanel, setShowApplicationsPanel] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedListingForMenu, setSelectedListingForMenu] = useState<any>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  const { user, isAuthenticated, accessToken } = useAuth();
  const { listAnnouncementsByOwner, deleteAnnouncement, updateAnnouncementStatus } = useAnnouncementsApi();
  const { listApplications } = useApplicationsApi();
  const { getRatingsGiven, createRating, updateRating } = useRatingsApi();
  const { getUserByUsername } = useUserApi();
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedListingForRating, setSelectedListingForRating] = useState<any>(null);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Helper function to load listings with guardian info
  const loadListingsWithGuardianInfo = async () => {
    if (!isAuthenticated || !user?.username || !accessToken) return;

    try {
      const announcements = await listAnnouncementsByOwner(user.username);
      
      if (announcements) {
        const listingsWithStats = await Promise.all(announcements.map(async (ann) => {
          const applications = await listApplications({ announcementId: ann.id });
          const publicImageUris = normalizeImageList(ann.publicImages);
          
          let guardianInfo = null;
          let guardianUsername: string | null = null;
          let ratingGiven = false;
          let ratingId: number | undefined;
          
          if (ann.status === 'COMPLETED' && applications) {
            const acceptedApp = applications.find(app => app.status === 'ACCEPTED');
            if (acceptedApp?.guardianUsername) {
              guardianUsername = acceptedApp.guardianUsername;
              try {
                guardianInfo = await getUserByUsername(guardianUsername);
                if (user?.username) {
                  const ratingsGiven = await getRatingsGiven(user.username, { limit: 100, page: 0 });
                  if (ratingsGiven?.content) {
                    const existingRating = ratingsGiven.content.find((r: RatingDto) => 
                      r.recipientId === guardianUsername
                    );
                    if (existingRating) {
                      ratingGiven = true;
                      ratingId = existingRating.id;
                    }
                  }
                }
              } catch (err) {
                console.warn(`Failed to fetch guardian info for ${guardianUsername}:`, err);
              }
            }
          }

          return {
            id: String(ann.id),
            title: ann.title,
            location: ann.location,
            price: ann.remuneration || 0,
            period: ann.startDate ? new Date(ann.startDate).toLocaleDateString('fr-FR') : '',
            frequency: ann.visitFrequency || "À discuter",
            status: ann.status?.toLowerCase() || 'pending',
            applications: applications?.length || 0,
            imageUri: publicImageUris[0] || null,
            tags: ann.careTypeLabel ? [ann.careTypeLabel] : [],
            createdAt: ann.createdAt ? new Date(ann.createdAt).toLocaleDateString('fr-FR') : 'Récemment',
            guardian: guardianInfo ? `${guardianInfo.firstName || ''} ${guardianInfo.lastName || ''}`.trim() || guardianUsername : guardianUsername,
            guardianUsername,
            guardianAvatar: guardianInfo?.profilePhoto,
            ratingGiven,
            ratingId,
          };
        }));

        const grouped = {
          active: listingsWithStats.filter(l => l.status === 'published' || l.status === 'in_progress'),
          completed: listingsWithStats.filter(l => l.status === 'completed'),
        };

        setUserListings(grouped);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
    }
  };

  useEffect(() => {
    const loadUserListings = async () => {
      if (!isAuthenticated || !user?.username || !accessToken) return;

      try {
        setIsLoading(true);
        await loadListingsWithGuardianInfo();
      } catch (error) {
        console.error('Error loading user listings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserListings();
  }, [user?.username, isAuthenticated, accessToken, listAnnouncementsByOwner, listApplications, getRatingsGiven, getUserByUsername]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="outline" style={styles.activeBadge}>{t('myListings.badges.active')}</Badge>;
      case "completed":
        return <Badge variant="outline" style={styles.completedBadge}>{t('myListings.badges.completed')}</Badge>;
      default:
        return null;
    }
  };

  const handleMenuPress = (listing: any) => {
    setSelectedListingForMenu(listing);
    setMenuVisible(true);
  };

  const handleDelete = () => {
    if (!selectedListingForMenu) return;
    
    Alert.alert(
      t('myListings.modals.deleteTitle'),
      t('myListings.modals.deleteConfirm', { title: selectedListingForMenu.title }),
      [
        {
          text: t('myListings.modals.cancel'),
          style: "cancel"
        },
        {
          text: t('myListings.modals.delete'),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAnnouncement(Number(selectedListingForMenu.id));
              setMenuVisible(false);
              setSelectedListingForMenu(null);
              await loadListingsWithGuardianInfo();
            } catch (error) {
              console.error('Error deleting announcement:', error);
              Alert.alert(t('common.error'), t('myListings.modals.errorDeleting'));
            }
          }
        }
      ]
    );
  };

  const handleChangeStatus = () => {
    setMenuVisible(false);
    setShowStatusModal(true);
  };

  const handleStatusSelect = async (status: AnnouncementStatus) => {
    if (!selectedListingForMenu) return;

    try {
      await updateAnnouncementStatus(Number(selectedListingForMenu.id), status);
      setShowStatusModal(false);
      setSelectedListingForMenu(null);
      await loadListingsWithGuardianInfo();
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert(t('common.error'), t('myListings.modals.errorUpdatingStatus'));
    }
  };

  const getStatusLabel = (status: AnnouncementStatus): string => {
    switch (status) {
      case 'PUBLISHED':
        return t('myListings.modals.statuses.published');
      case 'IN_PROGRESS':
        return t('myListings.modals.statuses.inProgress');
      case 'COMPLETED':
        return t('myListings.modals.statuses.completed');
      default:
        return status;
    }
  };

  const renderListing = (listing: any) => (
    <Card key={listing.id} style={styles.listingCard}>
      <CardContent>
        <View style={styles.cardHeader}>
          <View style={styles.listingMainInfo}>
            <View style={styles.listingImageContainer}>
              {listing.imageUri ? (
                <ImageWithFallback
                  source={{ uri: listing.imageUri }}
                  style={styles.listingImage}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Icon name="Image" size={24} color={theme.colors.mutedForeground} />
                </View>
              )}
            </View>
            <View style={styles.listingInfo}>
              <Text style={styles.listingTitle}>{listing.title}</Text>
              <View style={styles.locationRow}>
                <Icon name="location" size={12} color={theme.colors.mutedForeground} />
                <Text style={styles.locationText}>{listing.location}</Text>
              </View>
            </View>
          </View>
          {getStatusBadge(listing.status)}
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('myListings.details.price')}</Text>
            <Text style={[styles.detailValue, styles.priceValue]}>{listing.price}€/jour</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('myListings.details.period')}</Text>
            <Text style={styles.detailValue}>{listing.period}</Text>
          </View>
          {listing.status !== 'completed' && (
            <TouchableOpacity 
              style={styles.detailItem}
              onPress={() => {
                if (listing.applications > 0) {
                  setSelectedAnnouncement({ id: Number(listing.id), title: listing.title });
                  setShowApplicationsPanel(true);
                }
              }}
              disabled={listing.applications === 0}
            >
              <Text style={styles.detailLabel}>{t('myListings.details.applications')}</Text>
              <View style={styles.statRow}>
                <Icon name="person" size={12} color={theme.colors.mutedForeground} />
                <Text style={[styles.detailValue, listing.applications > 0 && styles.clickableValue]}>
                  {listing.applications}
                </Text>
                {listing.applications > 0 && (
                  <Icon name="ChevronRight" size={12} color={theme.colors.mutedForeground} />
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tagsRow}>
          {listing.tags.slice(0, 2).map((tag: string) => (
            <Badge key={tag} variant="outline" style={styles.tagBadge}>
              {tag}
            </Badge>
          ))}
        </View>

        {listing.status === 'completed' && listing.guardian && (
          <View style={styles.guardianSection}>
            <View style={styles.guardianInfo}>
              <View style={styles.guardianHeader}>
                <View style={styles.guardianAvatar}>
                  {listing.guardianAvatar ? (
                    <ImageWithFallback
                      source={{ uri: listing.guardianAvatar }}
                      style={styles.guardianAvatarImage}
                      fallbackIcon="person"
                    />
                  ) : (
                    <Icon name="person" size={20} color={theme.colors.mutedForeground} />
                  )}
                </View>
                <Text style={styles.guardianText}>{t('myListings.details.guardedBy', { name: listing.guardian })}</Text>
              </View>
            </View>
            <View style={styles.guardianActions}>
              <Button
                variant="outline"
                size="sm"
                style={styles.rateGuardianButton}
                onPress={() => {
                  setSelectedListingForRating(listing);
                  setRatingScore(0);
                  setRatingComment('');
                  setRatingModalVisible(true);
                }}
                disabled={listing.ratingGiven}
              >
                <Icon 
                  name="star" 
                  size={16} 
                  color={listing.ratingGiven ? theme.colors.mutedForeground : theme.colors.foreground} 
                  style={styles.buttonIcon} 
                />
                <Text style={[
                  styles.buttonText,
                  listing.ratingGiven && styles.disabledButtonText
                ]}>
                  {listing.ratingGiven ? t('myListings.details.alreadyRated') : t('myListings.details.rateGuardian')}
                </Text>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                style={styles.moreButton}
                onPress={() => handleMenuPress(listing)}
              >
                <Icon name="ellipsis-vertical" size={16} color={theme.colors.foreground} />
              </Button>
            </View>
          </View>
        )}

        <View style={styles.listingFooter}>
          {listing.status !== 'completed' && (
            <Text style={styles.createdAt}>{t('myListings.details.created', { date: listing.createdAt })}</Text>
          )}
          <View style={styles.actionButtons}>
            {listing.status !== 'completed' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  style={styles.editButton}
                  onPress={() => onEditListing?.(listing.id)}
                >
                  <Icon name="create" size={16} color={theme.colors.foreground} style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>{t('myListings.details.edit')}</Text>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  style={styles.moreButton}
                  onPress={() => handleMenuPress(listing)}
                >
                  <Icon name="ellipsis-vertical" size={16} color={theme.colors.foreground} />
                </Button>
              </>
            )}
          </View>
        </View>
      </CardContent>
    </Card>
  );

  const tabCounts = {
    active: userListings.active.length,
    completed: userListings.completed.length,
  };

  const getCurrentListings = () => {
    switch (selectedTab) {
      case "active":
        return userListings.active;
      case "completed":
        return userListings.completed;
      default:
        return [];
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader 
        title={t('myListings.title')}
        showBackButton={true}
        onBack={onBack}
        rightButton={{
          icon: "Plus",
          onPress: onCreateListing
        }}
      />

      {/* Quick Stats */}
      <View style={styles.statsHeader}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{tabCounts.active}</Text>
          <Text style={styles.statLabel}>{t('myListings.stats.active')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {userListings.active.reduce((acc, listing) => acc + listing.applications, 0)}
          </Text>
          <Text style={styles.statLabel}>{t('myListings.stats.applications')}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { id: "active", label: t('myListings.tabs.active'), count: tabCounts.active },
          { id: "completed", label: t('myListings.tabs.completed'), count: tabCounts.completed },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={selectedTab === tab.id ? "default" : "ghost"}
            size="sm"
            onPress={() => setSelectedTab(tab.id)}
            style={selectedTab === tab.id ? 
              StyleSheet.flatten([styles.tabButton, styles.activeTabButton]) : 
              styles.tabButton
            }
          >
            <Text style={[
              styles.tabButtonText,
              selectedTab === tab.id && styles.activeTabButtonText
            ]}>
              {tab.label}
            </Text>
          </Button>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {getCurrentListings().length > 0 ? (
          <View style={styles.listingsContainer}>
            {getCurrentListings().map(renderListing)}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="Plus" size={64} color={theme.colors.mutedForeground} />
            <Text style={styles.emptyTitle}>
              {selectedTab === "active" ? t('myListings.empty.noActive') : t('myListings.empty.noCompleted')}
            </Text>
            <Text style={styles.emptyDescription}>
              {selectedTab === "active" 
                ? t('myListings.empty.createFirst')
                : t('myListings.empty.completedWillAppear')}
            </Text>
            {selectedTab === "active" && (
              <Button onPress={onCreateListing} style={styles.emptyActionButton}>
                <Icon name="Plus" size={16} color={theme.colors.primaryForeground} />
                <Text style={styles.emptyActionButtonText}>{t('myListings.empty.createListing')}</Text>
              </Button>
            )}
          </View>
        )}
      </ScrollView>

      {/* Applications Panel */}
      {selectedAnnouncement && (
        <ApplicationsPanel
          visible={showApplicationsPanel}
          announcementId={selectedAnnouncement.id}
          announcementTitle={selectedAnnouncement.title}
          onClose={() => {
            setShowApplicationsPanel(false);
            setSelectedAnnouncement(null);
          }}
          onApplicationUpdated={() => {
            loadListingsWithGuardianInfo();
          }}
        />
      )}

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContent}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleChangeStatus}
            >
              <Icon name="swap-vertical" size={20} color={theme.colors.foreground} />
              <Text style={styles.menuItemText}>{t('myListings.details.changeStatus')}</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={[styles.menuItem, styles.deleteMenuItem]}
              onPress={handleDelete}
            >
              <Icon name="trash" size={20} color="#ef4444" />
              <Text style={[styles.menuItemText, styles.deleteMenuText]}>{t('myListings.details.delete')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Status Selection Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowStatusModal(false);
          setSelectedListingForMenu(null);
        }}
      >
        <View style={styles.statusModalOverlay}>
          <View style={styles.statusModalContent}>
            <View style={styles.statusModalHeader}>
              <Text style={styles.statusModalTitle}>{t('myListings.modals.changeStatusTitle')}</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowStatusModal(false);
                  setSelectedListingForMenu(null);
                }}
              >
                <Icon name="Close" size={24} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>
            <Text style={styles.statusModalSubtitle}>
              {t('myListings.modals.changeStatusSubtitle', { title: selectedListingForMenu?.title })}
            </Text>
            <View style={styles.statusOptions}>
              {(['PUBLISHED', 'IN_PROGRESS', 'COMPLETED'] as AnnouncementStatus[]).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={styles.statusOption}
                  onPress={() => handleStatusSelect(status)}
                >
                  <Text style={styles.statusOptionText}>{getStatusLabel(status)}</Text>
                  <Icon name="ChevronRight" size={16} color={theme.colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

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
              <Text style={styles.modalTitle}>{t('myListings.modals.rateGuardianTitle')}</Text>
              <TouchableOpacity
                onPress={() => setRatingModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>

            {selectedListingForRating && (
              <>
                <Text style={styles.modalSubtitle}>{selectedListingForRating.title}</Text>
                <Text style={styles.modalOwnerText}>{t('myListings.modals.guardian', { name: selectedListingForRating.guardian })}</Text>

                <View style={styles.ratingInputContainer}>
                  <Text style={styles.ratingLabel}>{t('myListings.modals.ratingLabel')}</Text>
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
                    <Text style={styles.ratingScoreText}>{t('myListings.modals.ratingScore', { score: ratingScore })}</Text>
                  )}
                </View>

                <View style={styles.commentContainer}>
                  <Text style={styles.commentLabel}>{t('myListings.modals.commentLabel')}</Text>
                  <Textarea
                    value={ratingComment}
                    onChangeText={setRatingComment}
                    placeholder={t('myListings.modals.commentPlaceholder')}
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
                    <Text>{t('myListings.modals.cancel')}</Text>
                  </Button>
                  <Button
                    onPress={async () => {
                      if (!selectedListingForRating?.guardianUsername || ratingScore === 0) {
                        Alert.alert(t('common.error'), t('myListings.modals.errorSelectRating'));
                        return;
                      }

                      if (!user?.username) {
                        Alert.alert(t('common.error'), t('myListings.modals.errorNotLoggedIn'));
                        return;
                      }

                      try {
                        setIsSubmittingRating(true);
                        
                        if (selectedListingForRating.ratingId) {
                          await updateRating(selectedListingForRating.ratingId, {
                            note: ratingScore,
                            commentaire: ratingComment || undefined,
                          });
                        } else {
                          await createRating(selectedListingForRating.guardianUsername, {
                            note: ratingScore,
                            commentaire: ratingComment || undefined,
                          });
                        }

                        setRatingModalVisible(false);
                        setSelectedListingForRating(null);
                        setRatingScore(0);
                        setRatingComment('');
                        await loadListingsWithGuardianInfo();
                        
                        Alert.alert(t('common.success'), t('myListings.modals.successRating'));
                      } catch (err) {
                        console.error('Error submitting rating:', err);
                        Alert.alert(t('common.error'), t('myListings.modals.errorSavingRating'));
                      } finally {
                        setIsSubmittingRating(false);
                      }
                    }}
                    disabled={ratingScore === 0 || isSubmittingRating}
                    style={styles.modalSubmitButton}
                  >
                    {isSubmittingRating ? (
                      <ActivityIndicator size="small" color={theme.colors.primaryForeground} />
                    ) : (
                      <Text style={styles.modalSubmitText}>{t('myListings.modals.save')}</Text>
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
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
  },
  createButton: {
    borderRadius: theme.borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  createButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primaryForeground,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  activeTabButton: {
    backgroundColor: theme.colors.primary,
  },
  tabButtonText: {
    fontSize: theme.fontSize.sm,
  },
  activeTabButtonText: {
    color: theme.colors.primaryForeground,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  listingsContainer: {
    gap: theme.spacing.lg,
    paddingBottom: 100,
  },
  listingCard: {
    overflow: 'hidden',
  },
  listingContent: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  listingImageContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.muted,
  },
  listingImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingInfo: {
    flex: 1,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  listingTitleContainer: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  listingTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  listingLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  locationText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  listingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  moreButton: {
    padding: theme.spacing.xs,
  },
  activeBadge: {
    borderColor: '#d1d5db',
  },
  completedBadge: {
    borderColor: '#d1d5db',
  },
  listingDetails: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  priceText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  periodText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  listingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  tagBadge: {
    borderColor: '#d1d5db',
  },
  tag: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  statTextPrimary: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
  },
  completedInfo: {
    alignItems: 'flex-end',
  },
  guardianText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  ratingText: {
    fontSize: theme.fontSize.xs,
    color: '#fbbf24',
  },
  createdAt: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing['6xl'],
    gap: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  emptyDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  emptyActionButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primaryForeground,
  },
  // Nouveaux styles inspirés de GuardHistoryPage
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  listingMainInfo: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
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
  priceValue: {
    fontWeight: theme.fontWeight.medium,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  guardianSection: {
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  guardianInfo: {
    marginBottom: theme.spacing.sm,
  },
  guardianHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  guardianActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  guardianAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  guardianAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  buttonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  buttonIcon: {
    marginRight: theme.spacing.xs,
  },
  clickableValue: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    minWidth: 200,
    ...theme.shadows.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  deleteMenuItem: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  menuItemText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
  },
  deleteMenuText: {
    color: '#ef4444',
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  statusModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  statusModalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing['2xl'],
    paddingHorizontal: theme.spacing.lg,
    maxHeight: '80%',
  },
  statusModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statusModalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
  },
  statusModalSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.xl,
  },
  statusOptions: {
    gap: theme.spacing.sm,
  },
  statusOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusOptionText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
  },
  rateGuardianButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  disabledButtonText: {
    color: theme.colors.mutedForeground,
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
