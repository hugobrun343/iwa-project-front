import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { PageHeader } from '../ui/PageHeader';
import { SearchBar } from '../ui/SearchBar';
import { Filters } from '../ui/Filters';
import { theme } from '../../styles/theme';
import { useAnnouncementsApi } from '../../hooks/api/useAnnouncementsApi';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

const DEFAULT_FILTERS: FilterOption[] = [
  { value: "animaux", label: "Animaux" },
  { value: "plantes", label: "Plantes" },
  { value: "logement", label: "Logement" },
  { value: "weekend", label: "Week-end" },
];

interface SearchHeaderProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: string[]) => void;
}

export function SearchHeader({ onSearch, onFilterChange }: SearchHeaderProps) {
  const { listCareTypes } = useAnnouncementsApi();
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>(DEFAULT_FILTERS);

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
          setFilterOptions(DEFAULT_FILTERS);
        }
      } catch (error) {
        console.error('Error fetching care types:', error);
        if (isMounted) {
          setFilterOptions(DEFAULT_FILTERS);
        }
      }
    };

    fetchCareTypes();

    return () => {
      isMounted = false;
    };
  }, [listCareTypes]);

  return (
    <>
      <PageHeader 
        title="Rechercher"
        icon="Search"
      />
      
      <View style={styles.searchSection}>
        {/* Search Bar */}
        <SearchBar 
          placeholder="Où cherchez-vous ?"
          onSearch={onSearch}
        />

        {/* Filters */}
        <Filters 
          filters={filterOptions}
          onFilterChange={onFilterChange}
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
