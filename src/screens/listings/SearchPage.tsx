import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SearchHeader } from '../../components/layout/SearchHeader';
import { ListingsGrid } from '../../components/listing/ListingsGrid';
import { theme } from '../../styles/theme';

interface SearchPageProps {
  listings: any[];
  onSearch: (query: string) => void;
  onFilterChange: (filters: string[]) => void;
  onListingClick: (listing: any) => void;
  onLikeToggle: (listingId: string) => void;
}

export function SearchPage({ 
  listings, 
  onSearch, 
  onFilterChange, 
  onListingClick, 
  onLikeToggle 
}: SearchPageProps) {
  return (
    <View style={styles.container}>
      {/* Search Header */}
      <SearchHeader 
        onSearch={onSearch}
        onFilterChange={onFilterChange}
      />

      {/* Content */}
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ListingsGrid 
          listings={listings} 
          onListingClick={onListingClick}
          onLikeToggle={onLikeToggle}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
});
