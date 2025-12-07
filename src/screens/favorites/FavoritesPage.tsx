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
import { useTranslation } from 'react-i18next';

interface Listing {
  id: string;
  title: string;
  location: string;
  price: number;
  period: string;
  description: string;
  imageUri?: string | null;
  tags: string[];
  careType?: string;
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
  const { t } = useTranslation();
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
    { value: "all", label: t('favorites.filters.all'), count: favoriteListings.length },
    { value: "animaux", label: t('favorites.filters.animals'), count: favoriteListings.filter(l => l.tags.includes("Animaux")).length },
    { value: "plantes", label: t('favorites.filters.plants'), count: favoriteListings.filter(l => l.tags.includes("Plantes")).length },
    { value: "jardin", label: t('favorites.filters.garden'), count: favoriteListings.filter(l => l.tags.includes("Jardin")).length },
  ];

  return (
    <View style={styles.container}>
      <PageHeader 
        title={t('favorites.title')}
        icon="heart-outline"
      />
      
      {/* Search and Filters */}
      <View style={styles.searchSection}>
        {/* Search Bar */}
        <SearchBar 
          placeholder={t('favorites.searchPlaceholder')}
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
                <Text style={styles.emptyTitle}>{t('favorites.empty.noFavorites')}</Text>
                <Text style={styles.emptyDescription}>
                  {t('favorites.empty.addFavorites')}
                </Text>
                <Button onPress={onBack} variant="outline" style={styles.discoverButton}>
                  {t('favorites.empty.discoverListings')}
                </Button>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="Search" size={64} color={theme.colors.mutedForeground} />
                <Text style={styles.emptyTitle}>{t('favorites.empty.noResults')}</Text>
                <Text style={styles.emptyDescription}>
                  {t('favorites.empty.tryFilters')}
                </Text>
                <Button 
                  onPress={() => {
                    setSearchQuery("");
                    setSelectedFilter("all");
                  }}
                  variant="outline"
                  style={styles.clearButton}
                >
                  {t('favorites.empty.clearFilters')}
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
