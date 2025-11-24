import React, { useState } from 'react';
import { View, StyleSheet, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Button } from './Button';
import { Icon } from './Icon';
import { theme } from '../../styles/theme';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterOption[];
  activeFilters: string[];
  onApplyFilters: (filters: string[]) => void;
}

export function FilterModal({ 
  visible, 
  onClose, 
  filters, 
  activeFilters, 
  onApplyFilters 
}: FilterModalProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(activeFilters);

  const toggleFilter = (filterValue: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterValue) 
        ? prev.filter(f => f !== filterValue)
        : [...prev, filterValue]
    );
  };

  const handleApply = () => {
    onApplyFilters(selectedFilters);
    onClose();
  };

  const handleReset = () => {
    setSelectedFilters([]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filtres</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Catégories</Text>
            <View style={styles.filterGrid}>
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  style={[
                    styles.filterItem,
                    selectedFilters.includes(filter.value) && styles.filterItemActive
                  ]}
                  onPress={() => toggleFilter(filter.value)}
                >
                  <View style={styles.filterContent}>
                    <Text style={[
                      styles.filterLabel,
                      selectedFilters.includes(filter.value) && styles.filterLabelActive
                    ]}>
                      {filter.label}
                    </Text>
                    {filter.count !== undefined && (
                      <Text style={[
                        styles.filterCount,
                        selectedFilters.includes(filter.value) && styles.filterCountActive
                      ]}>
                        ({filter.count})
                      </Text>
                    )}
                  </View>
                  {selectedFilters.includes(filter.value) && (
                    <Icon name="checkmark" size={16} color={theme.colors.primaryForeground} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button 
              variant="outline" 
              onPress={handleReset}
              style={styles.resetButton}
              textStyle={styles.resetButtonText}
            >
              Réinitialiser
            </Button>
            <Button 
              variant="default" 
              onPress={handleApply}
              style={styles.applyButton}
              textStyle={styles.applyButtonText}
            >
              Appliquer{selectedFilters.length > 0 ? ` (${selectedFilters.length})` : ''}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    height: '50%',
    paddingTop: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },
  filterGrid: {
    gap: theme.spacing.md,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  filterItemActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  filterLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.foreground,
  },
  filterLabelActive: {
    color: theme.colors.primaryForeground,
  },
  filterCount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  filterCountActive: {
    color: theme.colors.primaryForeground,
  },
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  resetButton: {
    flex: 1,
  },
  resetButtonText: {
    color: theme.colors.foreground,
  },
  applyButton: {
    flex: 2,
  },
  applyButtonText: {
    color: theme.colors.primaryForeground,
  },
});
