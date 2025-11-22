import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Button } from './Button';
import { Icon } from './Icon';
import { FilterModal } from './FilterModal';
import { theme } from '../../styles/theme';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FiltersProps {
  filters: FilterOption[];
  onFilterChange?: (activeFilters: string[]) => void;
  initialFilters?: string[];
}

export function Filters({ 
  filters, 
  onFilterChange,
  initialFilters = []
}: FiltersProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>(initialFilters);
  const [modalVisible, setModalVisible] = useState(false);
  
  const toggleFilter = (filter: string) => {
    const newFilters = activeFilters.includes(filter) 
      ? activeFilters.filter(f => f !== filter)
      : [...activeFilters, filter];
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleApplyFilters = (newFilters: string[]) => {
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.filtersButton}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="options-outline" size={16} color={theme.colors.foreground} />
          <Text style={styles.filtersText}>Filtres</Text>
          {activeFilters.length > 0 && (
            <View style={styles.filtersBadge}>
              <Text style={styles.filtersBadgeText}>{activeFilters.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTags}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterTag,
                activeFilters.includes(filter.value) && styles.filterTagActive
              ]}
              onPress={() => toggleFilter(filter.value)}
            >
              <Text style={[
                styles.filterTagText,
                activeFilters.includes(filter.value) && styles.filterTagTextActive
              ]}>
                {filter.label}{filter.count !== undefined ? ` (${filter.count})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FilterModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        filters={filters}
        activeFilters={activeFilters}
        onApplyFilters={handleApplyFilters}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  filtersText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  filtersBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.xs,
  },
  filtersBadgeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primaryForeground,
    fontWeight: theme.fontWeight.bold,
  },
  filterTags: {
    flex: 1,
  },
  filterTag: {
    marginRight: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  filterTagActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterTagText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  filterTagTextActive: {
    color: theme.colors.primaryForeground,
  },
});
