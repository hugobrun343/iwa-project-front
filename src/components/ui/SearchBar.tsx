import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Input } from './Input';
import { Icon } from './Icon';
import { theme } from '../../styles/theme';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  initialValue?: string;
}

export function SearchBar({ 
  placeholder = "Rechercher sur GuardHome", 
  onSearch,
  initialValue = ""
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  
  const handleSearch = () => {
    onSearch?.(searchQuery);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchInputWrapper}>
        <Input 
          placeholder={placeholder}
          style={styles.searchInput}
          placeholderTextColor={theme.colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Icon name="Search" size={16} color={theme.colors.primaryForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  searchInputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: theme.spacing.md,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 44,
    paddingLeft: theme.spacing['3xl'] + theme.spacing.xs,
    paddingRight: theme.spacing['5xl'],
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.full,
    borderWidth: 0,
    fontSize: theme.fontSize.md,
  },
  searchButton: {
    position: 'absolute',
    right: 4,
    top: '50%',
    transform: [{ translateY: -16 }],
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
});
