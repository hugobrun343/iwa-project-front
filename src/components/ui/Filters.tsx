import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, GestureResponderEvent, ScrollView } from 'react-native';
import { Icon } from './Icon';
import { Badge } from './Badge';
import { FilterModal } from './FilterModal';
import { theme } from '../../styles/theme';
import { DateRange } from '../../types/filters';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FiltersProps {
  filters: FilterOption[];
  onFilterChange?: (activeFilters: string[]) => void;
  initialFilters?: string[];
  initialDateRange?: DateRange;
  onDateRangeChange?: (range?: DateRange) => void;
}

type FilterSection = 'careType' | 'dates';

export function Filters({ 
  filters, 
  onFilterChange,
  initialFilters = [],
  initialDateRange,
  onDateRangeChange,
}: FiltersProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>(initialFilters);
  const [modalVisible, setModalVisible] = useState(false);
  const [focusedSection, setFocusedSection] = useState<FilterSection | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange ?? {});

  useEffect(() => {
    const nextFilters = initialFilters ?? [];
    setActiveFilters((prev) => {
      if (prev.length === nextFilters.length && prev.every((value, index) => value === nextFilters[index])) {
        return prev;
      }
      return nextFilters;
    });
  }, [initialFilters]);

  useEffect(() => {
    const nextRange = initialDateRange ?? {};
    setDateRange((prev) => {
      if (prev.start === nextRange.start && prev.end === nextRange.end) {
        return prev;
      }
      return nextRange;
    });
  }, [initialDateRange?.start, initialDateRange?.end]);

  const handleApplyFilters = (newFilters: string[], nextRange?: DateRange) => {
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
    const normalizedRange = nextRange ?? {};
    setDateRange(normalizedRange);
    onDateRangeChange?.(normalizedRange);
  };

  const handleClearDateRange = () => {
    const emptyRange: DateRange = {};
    setDateRange(emptyRange);
    onDateRangeChange?.(emptyRange);
  };

  const openModal = (section?: FilterSection) => {
    setFocusedSection(section ?? null);
    setModalVisible(true);
  };

  const formatDateForDisplay = (value?: string) => {
    if (!value) {
      return '';
    }
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) {
      return value;
    }
    return `${day}/${month}/${year}`;
  };

  const dateSummary = useMemo(() => {
    if (dateRange.start && dateRange.end) {
      return `${formatDateForDisplay(dateRange.start)} - ${formatDateForDisplay(dateRange.end)}`;
    }
    if (dateRange.start) {
      return `À partir du ${formatDateForDisplay(dateRange.start)}`;
    }
    if (dateRange.end) {
      return `Jusqu’au ${formatDateForDisplay(dateRange.end)}`;
    }
    return null;
  }, [dateRange]);

  const dateActive = Boolean(dateRange.start || dateRange.end);
  const activeBadgeCount = activeFilters.length + (dateActive ? 1 : 0);

  const selectedFilterLabels = useMemo(() => {
    return activeFilters.map(value => {
      const filter = filters.find(f => f.value === value);
      return filter ? filter.label : value;
    });
  }, [activeFilters, filters]);

  const handleClearDateRangePress = (event?: GestureResponderEvent) => {
    event?.stopPropagation?.();
    handleClearDateRange();
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.filtersButton}
          onPress={() => openModal()}
        >
          <Icon name="options-outline" size={16} color={theme.colors.foreground} />
          <Text style={styles.filtersText}>Filtres</Text>
          {activeBadgeCount > 0 && (
            <View style={styles.filtersBadge}>
              <Text style={styles.filtersBadgeText}>{activeBadgeCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {(activeFilters.length > 0 || dateSummary) && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.scrollContainer}
            contentContainerStyle={styles.careTypeBadgesContainer}
          >
            {selectedFilterLabels.map((label, index) => (
              <Badge key={`${activeFilters[index]}-${index}`} variant="default" style={styles.careTypeBadge}>
                {label}
              </Badge>
            ))}
            {dateSummary && (
              <TouchableOpacity 
                style={styles.dateTag}
                onPress={() => openModal('dates')}
              >
                <Icon name="Calendar" size={14} color={theme.colors.primaryForeground} />
                <Text style={styles.dateTagText}>{dateSummary}</Text>
                <TouchableOpacity onPress={handleClearDateRangePress}>
                  <Icon name="Close" size={14} color={theme.colors.primaryForeground} />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </View>

      <FilterModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setFocusedSection(null);
        }}
        filters={filters}
        activeFilters={activeFilters}
        onApplyFilters={handleApplyFilters}
        initialDateRange={dateRange}
        initialSection={focusedSection ?? undefined}
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
  },
  filtersBadgeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primaryForeground,
    fontWeight: theme.fontWeight.bold,
    paddingHorizontal: 4,
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  dateTagText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primaryForeground,
  },
  scrollContainer: {
    flex: 1,
    maxHeight: 32,
  },
  careTypeBadgesContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    alignItems: 'center',
    paddingRight: theme.spacing.sm,
  },
  careTypeBadge: {
    marginRight: 0,
  },
});
