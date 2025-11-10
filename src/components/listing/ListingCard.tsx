import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { theme } from '../../styles/theme';

interface ListingCardProps {
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
  onLikeToggle?: (id: string) => void;
}

export function ListingCard({
  id,
  title,
  location,
  price,
  period,
  frequency,
  description,
  imageUrl,
  tags,
  isLiked = false,
  rating,
  reviewCount,
  onLikeToggle,
}: ListingCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.imageContainer}>
        <ImageWithFallback
          src={imageUrl}
          style={styles.image}
          alt={title}
        />
        <View style={styles.tagsContainer}>
          {tags.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="secondary" style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </Badge>
          ))}
        </View>
        <TouchableOpacity 
          style={styles.heartContainer}
          onPress={() => onLikeToggle?.(id)}
        >
          <Icon 
            name={isLiked ? "heart" : "heart-outline"} 
            size={16} 
            color={isLiked ? "#ef4444" : "#ffffff"}
          />
        </TouchableOpacity>
      </View>
      
      <CardContent>
        <Text style={styles.title}>{title}</Text>
        
        <View style={styles.locationRow}>
          <Icon name="location" size={12} color={theme.colors.mutedForeground} />
          <Text style={styles.locationText}>{location}</Text>
        </View>
        
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
        
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Icon name="calendar" size={14} color={theme.colors.mutedForeground} />
            <Text style={styles.detailText}>{period}</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>{price}€/jour</Text>
          </View>
        </View>
        
        <View style={styles.frequencyRow}>
          <Icon name="time" size={14} color={theme.colors.mutedForeground} />
          <Text style={styles.detailText}>{frequency}</Text>
        </View>
        
        {rating && reviewCount && (
          <View style={styles.ratingRow}>
            <Icon name="star" size={14} color="#fbbf24" />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            <Text style={styles.reviewText}>({reviewCount} avis)</Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    borderWidth: 0,
    ...theme.shadows.sm,
  },
  imageContainer: {
    position: 'relative',
    height: 192,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tagsContainer: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  tag: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  heartContainer: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  locationText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  description: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  detailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  priceText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  frequencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  ratingText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  reviewText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  tagText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.foreground,
  },
});
