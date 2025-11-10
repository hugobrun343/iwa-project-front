import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { theme } from '../../styles/theme';

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
    tags: string[];
    isLiked?: boolean;
  };
  onBack: () => void;
  onMessage: () => void;
}

export function ListingDetailPage({ listing, onBack, onMessage }: ListingDetailPageProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(listing.isLiked || false);

  // Mock images for carousel
  const images = [
    listing.imageUrl,
    "https://images.unsplash.com/photo-1662454419622-a41092ecd245?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    "https://images.unsplash.com/photo-1652882860938-f90aa298e644?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400"
  ];

  const amenities = [
    { icon: "Settings", label: "WiFi gratuit" },
    { icon: "MapPin", label: "Parking" },
    { icon: "Settings", label: "Cuisine équipée" },
    { icon: "Settings", label: "Jardin/Balcon" }
  ];

  const toggleLike = () => {
    setIsLiked(!isLiked);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with image */}
        <View style={styles.imageContainer}>
          <ImageWithFallback
            src={images[currentImageIndex]}
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
              <View style={styles.ownerInfo}>
                <View style={styles.ownerAvatar}>
                  <Icon name="User" size={24} color={theme.colors.mutedForeground} />
                </View>
                <View style={styles.ownerDetails}>
                  <Text style={styles.ownerName}>Sophie Martin</Text>
                  <View style={styles.ownerMeta}>
                    <View style={styles.ratingContainer}>
                      <Icon name="Star" size={12} color="#fbbf24" />
                      <Text style={styles.ratingText}>4.9</Text>
                    </View>
                    <Text style={styles.ownerMetaText}>•</Text>
                    <Text style={styles.ownerMetaText}>Hôte depuis 2022</Text>
                    <View style={styles.verifiedContainer}>
                      <Icon name="ShieldCheckmark" size={12} color="#22c55e" />
                      <Text style={styles.verifiedText}>Vérifié</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Contact buttons */}
              <View style={styles.contactButtons}>
                <Button 
                  variant="outline" 
                  style={styles.contactButton}
                  onPress={onMessage}
                >
                  <Icon name="MessageCircle" size={16} color={theme.colors.foreground} />
                  <Text style={styles.contactButtonText}>Contacter</Text>
                </Button>
              </View>
            </CardContent>
          </Card>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {listing.description}
            </Text>
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Équipements</Text>
            <View style={styles.amenitiesGrid}>
              {amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityItem}>
                  <Text style={styles.amenityLabel}>{amenity.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Important Information */}
          <Card style={styles.importantCard}>
            <CardContent>
              <Text style={styles.importantTitle}>Informations importantes</Text>
              <View style={styles.importantList}>
                <View style={styles.importantItem}>
                  <Icon name="checkmark" size={16} color="#ea580c" />
                  <Text style={styles.importantText}>Les clés seront remises en main propre</Text>
                </View>
                <View style={styles.importantItem}>
                  <Icon name="checkmark" size={16} color="#ea580c" />
                  <Text style={styles.importantText}>Instructions détaillées fournies pour les soins</Text>
                </View>
                <View style={styles.importantItem}>
                  <Icon name="checkmark" size={16} color="#ea580c" />
                  <Text style={styles.importantText}>Numéro d'urgence disponible 24h/24</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Avis récents</Text>
            
            <View style={styles.reviewsContainer}>
              <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerAvatar}>
                    <Text style={styles.reviewerInitials}>JD</Text>
                  </View>
                  <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewerName}>Julie Dupont</Text>
                    <View style={styles.reviewStars}>
                      {[...Array(5)].map((_, i) => (
                        <Icon key={i} name="Star" size={12} color="#fbbf24" />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>Il y a 2 semaines</Text>
                </View>
                <Text style={styles.reviewText}>
                  "Excellente expérience ! L'appartement était impeccable et les chats adorables. 
                  Sophie a été très arrangeante et disponible. Je recommande vivement !"
                </Text>
              </View>

              <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerAvatar}>
                    <Text style={styles.reviewerInitials}>ML</Text>
                  </View>
                  <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewerName}>Marc Laurent</Text>
                    <View style={styles.reviewStars}>
                      {[...Array(5)].map((_, i) => (
                        <Icon key={i} name="Star" size={12} color="#fbbf24" />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>Il y a 1 mois</Text>
                </View>
                <Text style={styles.reviewText}>
                  "Parfait pour une première expérience de garde ! Tout était bien organisé 
                  et les instructions très claires."
                </Text>
              </View>
            </View>
          </View>
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
          onPress={onMessage}
          style={styles.messageButton}
        >
          <Icon name="MessageCircle" size={16} color={theme.colors.foreground} />
          <Text style={styles.messageButtonText}>Message</Text>
        </Button>
        
        <Button style={styles.reserveButton}>
          Réserver
        </Button>
      </View>
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
});
