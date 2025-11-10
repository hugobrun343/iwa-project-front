import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar } from '../../components/ui/SearchBar';
import { Filters } from '../../components/ui/Filters';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { ListingCard } from '../../components/listing/ListingCard';
import { theme } from '../../styles/theme';

interface Listing {
  id: string;
  title: string;
  location: string;
  price: number;
  period: string;
  description: string;
  imageUrl: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  isLiked?: boolean;
}

interface FavoritesPageProps {
  onBack: () => void;
  allListings: Listing[];
  onLikeToggle?: (id: string) => void;
  onListingClick?: (listing: Listing) => void;
}

export function FavoritesPage({ onBack, allListings, onLikeToggle, onListingClick }: FavoritesPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Filter only favorite listings
  const favoriteListings = allListings.filter(listing => listing.isLiked);

  // Filter by search and category
  const filteredListings = favoriteListings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === "all") return matchesSearch;
    return matchesSearch && listing.tags.some(tag => 
      tag.toLowerCase() === selectedFilter.toLowerCase()
    );
  });

  const filterOptions = [
    { value: "all", label: "Tous", count: favoriteListings.length },
    { value: "animaux", label: "Animaux", count: favoriteListings.filter(l => l.tags.includes("Animaux")).length },
    { value: "plantes", label: "Plantes", count: favoriteListings.filter(l => l.tags.includes("Plantes")).length },
    { value: "jardin", label: "Jardin", count: favoriteListings.filter(l => l.tags.includes("Jardin")).length },
  ];

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Mes favoris"
        icon="heart-outline"
      />
      
      {/* Search and Filters */}
      <View style={styles.searchSection}>
        {/* Search Bar */}
        <SearchBar 
          placeholder="Rechercher dans mes favoris..."
          onSearch={(query) => setSearchQuery(query)}
          initialValue={searchQuery}
        />

        {/* Filters */}
        <Filters 
          filters={filterOptions}
          onFilterChange={(filters) => {
            // Pour simplifier, on prend juste le premier filtre actif
            setSelectedFilter(filters.length > 0 ? filters[0] : "all");
          }}
          initialFilters={selectedFilter !== "all" ? [selectedFilter] : []}
        />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredListings.length === 0 ? (
          <View style={styles.emptyState}>
            {favoriteListings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="Heart" size={64} color={theme.colors.mutedForeground} />
                <Text style={styles.emptyTitle}>Aucun favori</Text>
                <Text style={styles.emptyDescription}>
                  Ajoutez des annonces à vos favoris en appuyant sur le cœur
                </Text>
                <Button onPress={onBack} variant="outline" style={styles.discoverButton}>
                  Découvrir les annonces
                </Button>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="Search" size={64} color={theme.colors.mutedForeground} />
                <Text style={styles.emptyTitle}>Aucun résultat</Text>
                <Text style={styles.emptyDescription}>
                  Essayez de modifier vos filtres de recherche
                </Text>
                <Button 
                  onPress={() => {
                    setSearchQuery("");
                    setSelectedFilter("all");
                  }}
                  variant="outline"
                  style={styles.clearButton}
                >
                  Effacer les filtres
                </Button>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            <View style={styles.listingsContainer}>
              {filteredListings.map((listing) => (
                <TouchableOpacity key={listing.id} onPress={() => onListingClick?.(listing)}>
                  <ListingCard {...listing} frequency="1 fois par jour" onLikeToggle={onLikeToggle} />
                </TouchableOpacity>
              ))}
            </View>
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
  searchSection: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing['6xl'],
  },
  emptyContainer: {
    alignItems: 'center',
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
  },
  discoverButton: {
    marginTop: theme.spacing.lg,
  },
  clearButton: {
    marginTop: theme.spacing.lg,
  },
  resultsContainer: {
    gap: theme.spacing.lg,
  },
  listingsContainer: {
    gap: theme.spacing.lg,
  },
});
