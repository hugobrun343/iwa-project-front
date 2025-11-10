import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ListingCard } from './ListingCard';
import { theme } from '../../styles/theme';

interface Listing {
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
  rating?: number;
  reviewCount?: number;
}

interface ListingsGridProps {
  listings: Listing[];
  onListingClick: (listing: Listing) => void;
  onLikeToggle: (id: string) => void;
}

export function ListingsGrid({ listings, onListingClick, onLikeToggle }: ListingsGridProps) {
  return (
    <View style={styles.container}>
      {listings.map((listing) => (
        <TouchableOpacity key={listing.id} onPress={() => onListingClick(listing)}>
          <ListingCard {...listing} onLikeToggle={onLikeToggle} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
  },
});