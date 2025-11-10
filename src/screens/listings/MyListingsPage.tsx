import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { theme } from '../../styles/theme';

interface MyListingsPageProps {
  onBack: () => void;
  onCreateListing: () => void;
}

export function MyListingsPage({ onBack, onCreateListing }: MyListingsPageProps) {
  const [selectedTab, setSelectedTab] = useState("active");

  // Mock data for user listings
  const userListings = {
    active: [
      {
        id: "1",
        title: "Appartement moderne avec vue - 2 chats adorables",
        location: "Paris 11ème",
        price: 35,
        period: "5-12 Jan",
        frequency: "2 fois par jour",
        status: "active",
        applications: 3,
        views: 24,
        imageUrl: "https://images.unsplash.com/photo-1594873604892-b599f847e859?w=300",
        tags: ["Animaux", "Plantes"],
        createdAt: "Il y a 2 jours",
      },
      {
        id: "2",
        title: "Jungle urbaine - Arrosage intensif requis",
        location: "Belleville",
        price: 20,
        period: "3-10 Fév",
        frequency: "1 jour sur 2",
        status: "active",
        applications: 1,
        views: 12,
        imageUrl: "https://images.unsplash.com/photo-1605260346600-f98d9cf022a5?w=300",
        tags: ["Plantes", "Longue durée"],
        createdAt: "Il y a 5 jours",
      },
    ],
    draft: [
      {
        id: "3",
        title: "Garde Minou - Brouillon",
        location: "Non définie",
        price: 0,
        period: "À définir",
        frequency: "Non définie",
        status: "draft",
        applications: 0,
        views: 0,
        imageUrl: null,
        tags: [],
        createdAt: "Il y a 3 jours",
      },
    ],
    completed: [
      {
        id: "4",
        title: "Golden Retriever énergique - Maison avec jardin",
        location: "Vincennes",
        price: 45,
        period: "15-20 Déc",
        frequency: "3 fois par jour",
        status: "completed",
        applications: 8,
        views: 45,
        imageUrl: "https://images.unsplash.com/photo-1687211818108-667d028f1ae4?w=300",
        tags: ["Animaux", "Jardin"],
        createdAt: "Il y a 1 mois",
        guardian: "Marc Dubois",
        rating: 5,
      },
    ],
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="outline" style={styles.activeBadge}>Active</Badge>;
      case "draft":
        return <Badge variant="outline" style={styles.draftBadge}>Brouillon</Badge>;
      case "completed":
        return <Badge variant="outline" style={styles.completedBadge}>Terminée</Badge>;
      default:
        return null;
    }
  };

  const renderListing = (listing: any) => (
    <Card key={listing.id} style={styles.listingCard}>
      <CardContent>
        <View style={styles.cardHeader}>
          <View style={styles.listingMainInfo}>
            <View style={styles.listingImageContainer}>
              {listing.imageUrl ? (
                <ImageWithFallback
                  src={listing.imageUrl}
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
            <Text style={styles.detailLabel}>Prix :</Text>
            <Text style={[styles.detailValue, styles.priceValue]}>{listing.price}€/jour</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Période :</Text>
            <Text style={styles.detailValue}>{listing.period}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Vues :</Text>
            <View style={styles.statRow}>
              <Icon name="eye" size={12} color={theme.colors.mutedForeground} />
              <Text style={styles.detailValue}>{listing.views}</Text>
            </View>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Candidatures :</Text>
            <View style={styles.statRow}>
              <Icon name="person" size={12} color={theme.colors.mutedForeground} />
              <Text style={styles.detailValue}>{listing.applications}</Text>
            </View>
          </View>
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
              <Text style={styles.guardianText}>Gardé par {listing.guardian}</Text>
              {listing.rating && (
                <View style={styles.ratingContainer}>
                  {[...Array(5)].map((_, i) => (
                    <Icon 
                      key={i} 
                      name="star" 
                      size={14} 
                      color={i < listing.rating ? "#fbbf24" : "#d1d5db"} 
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.listingFooter}>
          <Text style={styles.createdAt}>Créée {listing.createdAt}</Text>
          <View style={styles.actionButtons}>
            <Button variant="outline" size="sm" style={styles.editButton}>
              <Icon name="create" size={16} color={theme.colors.foreground} style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Modifier</Text>
            </Button>
            <Button variant="ghost" size="sm" style={styles.moreButton}>
              <Icon name="ellipsis-vertical" size={16} color={theme.colors.foreground} />
            </Button>
          </View>
        </View>
      </CardContent>
    </Card>
  );

  const tabCounts = {
    active: userListings.active.length,
    draft: userListings.draft.length,
    completed: userListings.completed.length,
  };

  const getCurrentListings = () => {
    switch (selectedTab) {
      case "active":
        return userListings.active;
      case "draft":
        return userListings.draft;
      case "completed":
        return userListings.completed;
      default:
        return [];
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Mes annonces"
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
          <Text style={styles.statLabel}>Actives</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {userListings.active.reduce((acc, listing) => acc + listing.views, 0)}
          </Text>
          <Text style={styles.statLabel}>Vues totales</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {userListings.active.reduce((acc, listing) => acc + listing.applications, 0)}
          </Text>
          <Text style={styles.statLabel}>Candidatures</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { id: "active", label: "Actives", count: tabCounts.active },
          { id: "draft", label: "Brouillons", count: tabCounts.draft },
          { id: "completed", label: "Terminées", count: tabCounts.completed },
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
              {selectedTab === "active" && "Aucune annonce active"}
              {selectedTab === "draft" && "Aucun brouillon"}
              {selectedTab === "completed" && "Aucune garde terminée"}
            </Text>
            <Text style={styles.emptyDescription}>
              {selectedTab === "active" && "Créez votre première annonce pour commencer à recevoir des candidatures."}
              {selectedTab === "draft" && "Vos brouillons d'annonces apparaîtront ici."}
              {selectedTab === "completed" && "Vos annonces terminées apparaîtront ici avec les détails de la garde."}
            </Text>
            {selectedTab === "active" && (
              <Button onPress={onCreateListing} style={styles.emptyActionButton}>
                <Icon name="Plus" size={16} color={theme.colors.primaryForeground} />
                <Text style={styles.emptyActionButtonText}>Créer une annonce</Text>
              </Button>
            )}
          </View>
        )}
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
  draftBadge: {
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
  },
  guardianInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});
