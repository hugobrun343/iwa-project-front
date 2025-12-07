import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { PageHeader } from '../ui/PageHeader';
import { SearchBar } from '../ui/SearchBar';
import { Filters } from '../ui/Filters';
import { theme } from '../../styles/theme';
import { useAnnouncementsApi } from '../../hooks/api/useAnnouncementsApi';
import { DateRange } from '../../types/filters';
import { useTranslation } from 'react-i18next';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface SearchHeaderProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: string[]) => void;
  onDateRangeChange?: (range?: DateRange) => void;
  initialFilters?: string[];
  initialDateRange?: DateRange;
  initialSearchQuery?: string;
}

export function SearchHeader({ 
  onSearch, 
  onFilterChange, 
  onDateRangeChange, 
  initialFilters, 
  initialDateRange,
  initialSearchQuery
}: SearchHeaderProps) {
  const { t } = useTranslation();
  const { listCareTypes } = useAnnouncementsApi();
  
  const defaultFilters = useMemo<FilterOption[]>(() => [
    { value: "animaux", label: t('search.filters.animals') },
    { value: "plantes", label: t('search.filters.plants') },
    { value: "logement", label: t('search.filters.housing') },
    { value: "weekend", label: t('search.filters.weekend') },
  ], [t]);

  const [filterOptions, setFilterOptions] = useState<FilterOption[]>(defaultFilters);

  useEffect(() => {
    let isMounted = true;

    const fetchCareTypes = async () => {
      try {
        const careTypes = await listCareTypes();
        if (!isMounted) {
          return;
        }

        if (careTypes && careTypes.length > 0) {
          const formatted = careTypes.map((type) => ({
            value: type.label,
            label: type.label,
          }));
          setFilterOptions(formatted);
        } else {
          setFilterOptions(defaultFilters);
        }
      } catch (error) {
        console.error('Error fetching care types:', error);
        if (isMounted) {
          setFilterOptions(defaultFilters);
        }
      }
    };

    fetchCareTypes();

    return () => {
      isMounted = false;
    };
  }, [listCareTypes, defaultFilters]);

  return (
    <>
      <PageHeader 
        title={t('search.title')}
        icon="Search"
      />
      
      <View style={styles.searchSection}>
        {/* Search Bar */}
        <SearchBar 
          placeholder={t('search.placeholder')}
          onSearch={onSearch}
          initialValue={initialSearchQuery}
        />

        {/* Filters */}
        <Filters 
          filters={filterOptions}
          onFilterChange={onFilterChange}
          onDateRangeChange={onDateRangeChange}
          initialFilters={initialFilters}
          initialDateRange={initialDateRange}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  searchSection: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
});
