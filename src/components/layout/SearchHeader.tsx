import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PageHeader } from '../ui/PageHeader';
import { SearchBar } from '../ui/SearchBar';
import { Filters } from '../ui/Filters';
import { theme } from '../../styles/theme';

interface SearchHeaderProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: string[]) => void;
}

export function SearchHeader({ onSearch, onFilterChange }: SearchHeaderProps) {
  const filterOptions = [
    { value: "animaux", label: "Animaux" },
    { value: "plantes", label: "Plantes" },
    { value: "logement", label: "Logement" },
    { value: "weekend", label: "Week-end" },
  ];

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
