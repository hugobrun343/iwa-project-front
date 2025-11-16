import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { Textarea } from '../../components/ui/Textarea';
import { theme } from '../../styles/theme';
import { useAnnouncementsApi } from '../../hooks/api/useAnnouncementsApi';
import { useUserApi } from '../../hooks/api/useUserApi';
import { useRatingsApi } from '../../hooks/api/useRatingsApi';
import { useApplicationsApi } from '../../hooks/api/useApplicationsApi';
import { useChatApi } from '../../hooks/api/useChatApi';
import { useAuth } from '../../contexts/AuthContext';
import { PublicUserDto, RatingDto } from '../../types/api';
import { Alert } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface ListingDetailPageProps {
  listing: {
    id: string;
    title: string;
    location: string;
    price: number;
    period: string;
    frequency: string;
    description: string;
    imageUrl: string;
    publicImages?: string[];
    tags: string[];
    isLiked?: boolean;
  };
  onBack: () => void;
  onMessage: (discussionId?: number) => void;
}

export function ListingDetailPage({ listing, onBack, onMessage }: ListingDetailPageProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(listing.isLiked || false);
  const [owner, setOwner] = useState<PublicUserDto | null>(null);
  const [ownerRating, setOwnerRating] = useState<number | null>(null);
  const [reviews, setReviews] = useState<Array<RatingDto & { author?: PublicUserDto }>>([]);
  const [isLoadingOwner, setIsLoadingOwner] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [specificInstructions, setSpecificInstructions] = useState<string | null>(null);
  const [isReserving, setIsReserving] = useState(false);
  const [hasApplication, setHasApplication] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [isCreatingMessage, setIsCreatingMessage] = useState(false);
  const [pendingMessageData, setPendingMessageData] = useState<{ announcementId: number; ownerUsername: string } | null>(null);

  const { getAnnouncementById } = useAnnouncementsApi();
  const { getUserByUsername } = useUserApi();
  const { getAverageRating, getRatingsReceived } = useRatingsApi();
  const { createApplication, listApplications } = useApplicationsApi();
  const { findDiscussion, createMessage } = useChatApi();
  const { user, isAuthenticated } = useAuth();

  // Use public images from announcement, fallback to listing.imageUrl if no images
  const images = listing.publicImages && listing.publicImages.length > 0 
    ? listing.publicImages 
    : [listing.imageUrl];

  // Fetch full announcement details and owner information
  useEffect(() => {
    const fetchListingDetails = async () => {
      try {
        setIsLoadingOwner(true);
        const announcementId = Number(listing.id);
        const fullAnnouncement = await getAnnouncementById(announcementId);
        
        if (fullAnnouncement) {
          // Store specific instructions for important info section
          if (fullAnnouncement.specificInstructions) {
            setSpecificInstructions(fullAnnouncement.specificInstructions);
          }

          // Check if user already has an application for this listing
          if (isAuthenticated && user?.username) {
            try {
              const applications = await listApplications({ 
                announcementId: announcementId,
                guardianUsername: user.username 
              });
              if (applications && applications.length > 0) {
                setHasApplication(true);
                setApplicationStatus(applications[0].status);
              }
            } catch (error) {
              console.error('Error checking applications:', error);
            }
          }

          // Fetch owner information
          if (fullAnnouncement.ownerUsername) {
            const ownerData = await getUserByUsername(fullAnnouncement.ownerUsername);
            if (ownerData) {
              setOwner(ownerData);
            }

            // Fetch owner rating
            const avgRating = await getAverageRating(fullAnnouncement.ownerUsername);
            if (avgRating !== null && avgRating !== undefined) {
              setOwnerRating(Number(avgRating.toFixed(1)));
            }

            // Fetch owner reviews
            setIsLoadingReviews(true);
            const reviewsData = await getRatingsReceived(fullAnnouncement.ownerUsername, { limit: 5, page: 0 });
            if (reviewsData?.content) {
              // Enrich reviews with author information
              const enrichedReviews = await Promise.all(
                reviewsData.content.map(async (review) => {
                  try {
                    const author = await getUserByUsername(review.authorId);
                    return { ...review, author };
                  } catch {
                    return review;
                  }
                })
              );
              setReviews(enrichedReviews);
            }
            setIsLoadingReviews(false);
          }
        }
      } catch (error) {
        console.error('Error fetching listing details:', error);
      } finally {
        setIsLoadingOwner(false);
      }
    };

    fetchListingDetails();
  }, [listing.id, getAnnouncementById, getUserByUsername, getAverageRating, getRatingsReceived, listApplications, isAuthenticated, user?.username, findDiscussion, createMessage]);

  const getDisplayName = (profile?: PublicUserDto, fallback?: string) => {
    if (!profile) {
      return fallback || 'Utilisateur';
    }
    const fullName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();
    return fullName || profile.username || fallback || 'Utilisateur';
  };

  const getInitials = (profile?: PublicUserDto) => {
    if (!profile) return '??';
    const first = profile.firstName?.[0] || '';
    const last = profile.lastName?.[0] || '';
    if (first && last) return `${first}${last}`.toUpperCase();
    if (profile.username) return profile.username.substring(0, 2).toUpperCase();
    return '??';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
    });
  };

  const formatReviewDate = (dateString?: string) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date inconnue';
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `Il y a ${months} mois`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `Il y a ${years} an${years > 1 ? 's' : ''}`;
    }
  };

  const getHostSinceYear = (registrationDate?: string) => {
    if (!registrationDate) return '';
    const year = new Date(registrationDate).getFullYear();
    if (isNaN(year)) return '';
    return `Hôte depuis ${year}`;
  };

  // Parse specific instructions into list items if available
  const parseInstructions = (instructions: string | null): string[] => {
    if (!instructions) return [];
    // Split by newlines or periods, filter empty strings
    return instructions
      .split(/[.\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .slice(0, 3); // Limit to 3 items
  };

  const importantInfoItems = parseInstructions(specificInstructions);

  const toggleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleReserve = async () => {
    if (!isAuthenticated || !user?.username) {
      Alert.alert('Connexion requise', 'Vous devez être connecté pour réserver.');
      return;
    }

    if (hasApplication) {
      const statusMessages = {
        'PENDING': 'Votre demande est en attente de réponse.',
        'ACCEPTED': 'Votre demande a été acceptée.',
        'REJECTED': 'Votre demande a été refusée.',
        'CANCELLED': 'Votre demande a été annulée.',
      };
      Alert.alert(
        'Demande existante',
        statusMessages[applicationStatus || 'PENDING'] || 'Vous avez déjà une demande pour cette annonce.'
      );
      return;
    }

    try {
      setIsReserving(true);
      const announcementId = Number(listing.id);
      
      const result = await createApplication({
        announcementId: announcementId,
        guardianUsername: user.username,
        status: 'PENDING',
        message: undefined, // Optional message
      });

      if (result) {
        setHasApplication(true);
        setApplicationStatus('PENDING');
        Alert.alert(
          'Demande envoyée',
          'Votre demande de réservation a été envoyée avec succès. Le propriétaire vous contactera bientôt.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error creating application:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de l\'envoi de votre demande. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsReserving(false);
    }
  };

  const getReserveButtonText = () => {
    if (isReserving) return 'Envoi...';
    if (hasApplication) {
      const statusText = {
        'PENDING': 'Demande envoyée',
        'ACCEPTED': 'Demande acceptée',
        'REJECTED': 'Demande refusée',
        'CANCELLED': 'Demande annulée',
      };
      return statusText[applicationStatus || 'PENDING'] || 'Déjà réservé';
    }
    return 'Réserver';
  };

  const isReserveButtonDisabled = () => {
    return isReserving || hasApplication || !isAuthenticated;
  };

  const handleSendCustomMessage = async () => {
    if (!pendingMessageData) return;

    const messageContent = customMessage.trim();
    if (!messageContent) {
      Alert.alert('Message requis', 'Veuillez saisir un message.');
      return;
    }

    try {
      setIsCreatingMessage(true);
      
      const newMessage = await createMessage({
        content: messageContent,
        announcementId: pendingMessageData.announcementId,
        recipientId: pendingMessageData.ownerUsername,
      });

      if (newMessage && newMessage.discussionId) {
        setShowMessageModal(false);
        setCustomMessage('');
        setPendingMessageData(null);
        onMessage(newMessage.discussionId);
      } else {
        Alert.alert('Erreur', 'Impossible de créer la discussion. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Error creating message:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de l\'envoi du message. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCreatingMessage(false);
    }
  };

  const handleCancelMessage = () => {
    setShowMessageModal(false);
    setCustomMessage('');
    setPendingMessageData(null);
  };

  const handleMessage = async () => {
    if (!isAuthenticated || !user?.username) {
      Alert.alert('Connexion requise', 'Vous devez être connecté pour envoyer un message.');
      return;
    }

    try {
      const announcementId = Number(listing.id);
      let discussionId: number | undefined;

      // Get owner username from announcement
      const fullAnnouncement = await getAnnouncementById(announcementId);
      if (!fullAnnouncement?.ownerUsername) {
        Alert.alert('Erreur', 'Impossible de trouver le propriétaire de cette annonce.');
        return;
      }

      const ownerUsername = fullAnnouncement.ownerUsername;

      // Check if discussion already exists
      const existingDiscussion = await findDiscussion({
        announcementId: announcementId,
        recipientId: ownerUsername,
      });

      // Check if discussion exists by verifying id is not null
      // API returns object with all null values when discussion doesn't exist
      if (existingDiscussion && existingDiscussion.id !== null && existingDiscussion.id !== undefined) {
        // Discussion exists, navigate to it
        discussionId = existingDiscussion.id;
        onMessage(discussionId);
      } else {
        // No discussion exists, show modal to customize message
        setPendingMessageData({ announcementId, ownerUsername });
        setCustomMessage(`Bonjour, je suis intéressé(e) par votre annonce "${listing.title}".`);
        setShowMessageModal(true);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de l\'ouverture de la discussion. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with image */}
        <View style={styles.imageContainer}>
          <ImageWithFallback
            source={{ uri: images[currentImageIndex] }}
            style={styles.image}
          />
          
          {/* Header overlay */}
          <View style={styles.headerOverlay}>
            <Button 
              variant="ghost" 
              size="sm" 
              onPress={onBack}
              style={styles.backButton}
            >
              <Icon name="ArrowLeft" size={20} color={theme.colors.foreground} />
            </Button>
            
            <View style={styles.headerActions}>
              <Button 
                variant="ghost" 
                size="sm"
                style={styles.headerActionButton}
              >
                <Icon name="share" size={16} color={theme.colors.foreground} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onPress={toggleLike}
                style={styles.headerActionButton}
              >
                <Icon 
                  name={isLiked ? "HeartFilled" : "Heart"} 
                  size={16} 
                  color={isLiked ? "#ef4444" : theme.colors.foreground}
                />
              </Button>
            </View>
          </View>

          {/* Image indicators */}
          {images.length > 1 && (
            <View style={styles.imageIndicators}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    { backgroundColor: index === currentImageIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.5)' }
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Main Information */}
          <View style={styles.mainInfo}>
            <Text style={styles.title}>{listing.title}</Text>
            
            <View style={styles.locationRow}>
              <Icon name="MapPin" size={16} color={theme.colors.mutedForeground} />
              <Text style={styles.locationText}>{listing.location}</Text>
            </View>
            
            <View style={styles.locationRow}>
              <Icon name="Calendar" size={16} color={theme.colors.mutedForeground} />
              <Text style={styles.locationText}>{listing.period}</Text>
            </View>
            
            <View style={styles.locationRow}>
              <Icon name="Clock" size={16} color={theme.colors.mutedForeground} />
              <Text style={styles.locationText}>{listing.frequency}</Text>
            </View>

            {/* Tags */}
            <View style={styles.tagsContainer}>
              {listing.tags.map((tag) => (
                <Badge key={tag} variant="secondary" style={styles.tag}>
                  {tag}
                </Badge>
              ))}
            </View>

            {/* Price */}
            <View style={styles.priceRow}>
              <Icon name="Euro" size={20} color={theme.colors.primary} />
              <Text style={styles.priceAmount}>{listing.price}€</Text>
              <Text style={styles.pricePeriod}>/jour</Text>
            </View>
          </View>

          {/* Owner */}
          <Card style={styles.ownerCard}>
            <CardContent>
              {isLoadingOwner ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              ) : (
                <>
                  <View style={styles.ownerInfo}>
                    {owner?.profilePhoto ? (
                      <ImageWithFallback
                        source={{ uri: owner.profilePhoto }}
                        style={styles.ownerAvatarImage}
                        fallbackIcon="User"
                      />
                    ) : (
                      <View style={styles.ownerAvatar}>
                        <Icon name="User" size={24} color={theme.colors.mutedForeground} />
                      </View>
                    )}
                    <View style={styles.ownerDetails}>
                      <Text style={styles.ownerName}>
                        {owner ? getDisplayName(owner) : 'Propriétaire'}
                      </Text>
                      <View style={styles.ownerMeta}>
                        {ownerRating !== null && (
                          <>
                            <View style={styles.ratingContainer}>
                              <Icon name="Star" size={12} color="#fbbf24" />
                              <Text style={styles.ratingText}>{ownerRating}</Text>
                            </View>
                            <Text style={styles.ownerMetaText}>•</Text>
                          </>
                        )}
                        {owner?.registrationDate && (
                          <>
                            <Text style={styles.ownerMetaText}>
                              {getHostSinceYear(owner.registrationDate)}
                            </Text>
                            {owner.identityVerification && (
                              <>
                                <Text style={styles.ownerMetaText}>•</Text>
                                <View style={styles.verifiedContainer}>
                                  <Icon name="ShieldCheckmark" size={12} color="#22c55e" />
                                  <Text style={styles.verifiedText}>Vérifié</Text>
                                </View>
                              </>
                            )}
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                  
                  {/* Contact buttons */}
                  <View style={styles.contactButtons}>
                    <Button 
                      variant="outline" 
                      style={styles.contactButton}
                      onPress={handleMessage}
                    >
                      <Icon name="MessageCircle" size={16} color={theme.colors.foreground} />
                      <Text style={styles.contactButtonText}>Contacter</Text>
                    </Button>
                  </View>
                </>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {listing.description}
            </Text>
          </View>

          {/* Important Information */}
          {importantInfoItems.length > 0 && (
            <Card style={styles.importantCard}>
              <CardContent>
                <Text style={styles.importantTitle}>Informations importantes</Text>
                <View style={styles.importantList}>
                  {importantInfoItems.map((item, index) => (
                    <View key={index} style={styles.importantItem}>
                      <Icon name="checkmark" size={16} color="#ea580c" />
                      <Text style={styles.importantText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          )}

          {/* Recent Reviews */}
          {reviews.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Avis récents</Text>
              
              {isLoadingReviews ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              ) : (
                <View style={styles.reviewsContainer}>
                  {reviews.map((review) => (
                    <View key={review.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        {review.author?.profilePhoto ? (
                          <ImageWithFallback
                            source={{ uri: review.author.profilePhoto }}
                            style={styles.reviewerAvatarImage}
                            fallbackIcon="User"
                          />
                        ) : (
                          <View style={styles.reviewerAvatar}>
                            <Text style={styles.reviewerInitials}>
                              {getInitials(review.author)}
                            </Text>
                          </View>
                        )}
                        <View style={styles.reviewerInfo}>
                          <Text style={styles.reviewerName}>
                            {getDisplayName(review.author, review.authorId)}
                          </Text>
                          <View style={styles.reviewStars}>
                            {[...Array(5)].map((_, i) => (
                              <Icon
                                key={i}
                                name="Star"
                                size={12}
                                color={i < review.score ? "#fbbf24" : "#e5e7eb"}
                              />
                            ))}
                          </View>
                        </View>
                        <Text style={styles.reviewDate}>
                          {formatReviewDate(review.createdAt)}
                        </Text>
                      </View>
                      {review.comment && (
                        <Text style={styles.reviewText}>
                          "{review.comment}"
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed footer with actions */}
      <View style={styles.footer}>
        <View style={styles.footerPricing}>
          <View style={styles.footerPriceContainer}>
            <Icon name="Euro" size={16} color={theme.colors.primary} />
            <Text style={styles.footerPrice}>{listing.price}€</Text>
            <Text style={styles.footerPeriod}>/jour</Text>
          </View>
          <Text style={styles.footerDates}>{listing.period}</Text>
        </View>
        
        <Button 
          variant="outline" 
          size="sm"
          onPress={handleMessage}
          style={styles.messageButton}
        >
          <Icon name="MessageCircle" size={16} color={theme.colors.foreground} />
          <Text style={styles.messageButtonText}>Message</Text>
        </Button>
        
        <Button 
          style={styles.reserveButton}
          onPress={handleReserve}
          disabled={isReserveButtonDisabled()}
        >
          {getReserveButtonText()}
        </Button>
      </View>

      {/* Message Modal */}
      <Modal
        visible={showMessageModal}
        transparent
        animationType="slide"
        onRequestClose={handleCancelMessage}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Envoyer un message</Text>
              <TouchableOpacity onPress={handleCancelMessage} style={styles.modalCloseButton}>
                <Icon name="close" size={24} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Votre message</Text>
              <Textarea
                value={customMessage}
                onChangeText={setCustomMessage}
                placeholder="Écrivez votre message ici..."
                rows={6}
                style={styles.messageTextarea}
              />
            </View>

            <View style={styles.modalFooter}>
              <Button
                variant="outline"
                onPress={handleCancelMessage}
                style={styles.modalCancelButton}
                disabled={isCreatingMessage}
              >
                <Text>Annuler</Text>
              </Button>
              <Button
                onPress={handleSendCustomMessage}
                style={styles.modalSendButton}
                disabled={isCreatingMessage || !customMessage.trim()}
              >
                {isCreatingMessage ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSendButtonText}>Envoyer</Text>
                )}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 320,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 50,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.borderRadius.full,
    width: 40,
    height: 40,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  headerActionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.borderRadius.full,
    width: 40,
    height: 40,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageIndicators: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    padding: theme.spacing.xl,
    gap: theme.spacing.xl,
  },
  mainInfo: {
    gap: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.md,
  },
  tag: {
    backgroundColor: 'rgba(206, 181, 167, 0.2)',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  priceAmount: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  pricePeriod: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
  ownerCard: {
    marginVertical: theme.spacing.lg,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  ownerDetails: {
    flex: 1,
  },
  ownerName: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  ownerMeta: {
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
    color: theme.colors.mutedForeground,
  },
  ownerMetaText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  verifiedText: {
    fontSize: theme.fontSize.sm,
    color: '#22c55e',
  },
  contactButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  contactButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  contactButtonText: {
    fontSize: theme.fontSize.sm,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  description: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    lineHeight: 24,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  amenityItem: {
    width: (screenWidth - theme.spacing.xl * 2 - theme.spacing.md) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.muted + '80',
    borderRadius: theme.borderRadius.lg,
  },
  amenityLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  importantCard: {
    borderColor: '#fed7aa',
    backgroundColor: '#fef3e2',
  },
  importantTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: '#ea580c',
    marginBottom: theme.spacing.sm,
  },
  importantList: {
    gap: theme.spacing.sm,
  },
  importantItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  importantText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: '#c2410c',
  },
  reviewsContainer: {
    gap: theme.spacing.lg,
  },
  reviewCard: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.muted + '30',
    borderRadius: theme.borderRadius.lg,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  loadingContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerInitials: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  reviewDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  reviewText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    paddingBottom: 30,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  footerPricing: {
    flex: 1,
  },
  footerPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  footerPrice: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  footerPeriod: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  footerDates: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  messageButtonText: {
    fontSize: theme.fontSize.sm,
  },
  reserveButton: {
    paddingHorizontal: theme.spacing.xl,
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
    paddingTop: theme.spacing.lg,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.foreground,
  },
  modalCloseButton: {
    padding: theme.spacing.xs,
  },
  modalBody: {
    padding: theme.spacing.lg,
  },
  modalLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  messageTextarea: {
    minHeight: 120,
    maxHeight: 200,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  modalCancelButton: {
    flex: 1,
  },
  modalSendButton: {
    flex: 1,
  },
  modalSendButtonText: {
    color: '#ffffff',
    fontWeight: theme.fontWeight.medium,
  },
});
