import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Button } from './Button';
import { Icon } from './Icon';
import { DatePicker } from './DatePicker';
import { theme } from '../../styles/theme';
import { DateRange } from '../../types/filters';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

type FilterSection = 'careType' | 'dates';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterOption[];
  activeFilters: string[];
  onApplyFilters: (filters: string[], dateRange?: DateRange) => void;
  initialDateRange?: DateRange;
  initialSection?: FilterSection;
}

export function FilterModal({ 
  visible, 
  onClose, 
  filters, 
  activeFilters, 
  onApplyFilters,
  initialDateRange,
  initialSection
}: FilterModalProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(activeFilters);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: initialDateRange?.start,
    end: initialDateRange?.end,
  });
  const [detailSection, setDetailSection] = useState<FilterSection | null>(null);

  useEffect(() => {
    if (visible) {
      setSelectedFilters(activeFilters);
      setDateRange({
        start: initialDateRange?.start,
        end: initialDateRange?.end,
      });
      setDetailSection(initialSection ?? null);
    }
  }, [visible, activeFilters, initialDateRange, initialSection]);

  const toggleFilter = (filterValue: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterValue) 
        ? prev.filter(f => f !== filterValue)
        : [...prev, filterValue]
    );
  };

  const handleApply = () => {
    onApplyFilters(selectedFilters, dateRange);
    onClose();
  };

  const handleReset = () => {
    onApplyFilters([], {});
    onClose();
  };

  const setStartDate = (value?: string) => {
    setDateRange((prev) => ({
      ...prev,
      start: value,
      end: prev.end && value && prev.end < value ? value : prev.end,
    }));
  };

  const setEndDate = (value?: string) => {
    setDateRange((prev) => ({
      ...prev,
      end: value,
    }));
  };

  const parseDate = (value?: string) => {
    if (!value) {
      return undefined;
    }
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
      return undefined;
    }
    return new Date(year, month - 1, day);
  };

  const today = new Date();
  const startMinimumDate = today;
  const endMinimumDate = parseDate(dateRange.start) || today;

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

  const careTypeSummary = useMemo(() => {
    if (selectedFilters.length === 0) {
      return 'Tous les soins';
    }
    if (selectedFilters.length === 1) {
      const match = filters.find((f) => f.value === selectedFilters[0]);
      return match?.label ?? selectedFilters[0];
    }
    return `${selectedFilters.length} sélectionnés`;
  }, [selectedFilters, filters]);

  const dateSummary = useMemo(() => {
    const hasStart = Boolean(dateRange.start);
    const hasEnd = Boolean(dateRange.end);
    if (hasStart && hasEnd) {
      return `${formatDateForDisplay(dateRange.start)} - ${formatDateForDisplay(dateRange.end)}`;
    }
    if (hasStart) {
      return `À partir du ${formatDateForDisplay(dateRange.start)}`;
    }
    if (hasEnd) {
      return `Jusqu’au ${formatDateForDisplay(dateRange.end)}`;
    }
    return 'Toutes les dates';
  }, [dateRange]);

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

          <View style={styles.summaryList}>
            <TouchableOpacity
              style={styles.summaryButton}
              onPress={() => setDetailSection('careType')}
            >
              <View style={styles.summaryTextWrapper}>
                <Text style={styles.summaryLabel}>CareType</Text>
                <Text style={styles.summaryValue}>{careTypeSummary}</Text>
              </View>
              <Icon name="ChevronRight" size={16} color={theme.colors.mutedForeground} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.summaryButton}
              onPress={() => setDetailSection('dates')}
            >
              <View style={styles.summaryTextWrapper}>
                <Text style={styles.summaryLabel}>Dates</Text>
                <Text style={styles.summaryValue}>{dateSummary}</Text>
              </View>
              <Icon name="ChevronRight" size={16} color={theme.colors.mutedForeground} />
            </TouchableOpacity>
          </View>

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
              Appliquer
            </Button>
          </View>
        </View>

        <Modal
          visible={detailSection !== null}
          animationType="slide"
          onRequestClose={() => setDetailSection(null)}
        >
          <View style={styles.detailScreen}>
            <View style={styles.detailHeader}>
              <TouchableOpacity onPress={() => setDetailSection(null)} style={styles.detailCloseButton}>
                <Icon name="ArrowLeft" size={20} color={theme.colors.foreground} />
              </TouchableOpacity>
              <Text style={styles.detailTitle}>
                {detailSection === 'dates' ? 'Dates' : 'CareType'}
              </Text>
              <View style={styles.detailHeaderSpacer} />
            </View>

            <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
              {detailSection === 'careType' && (
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
              )}

              {detailSection === 'dates' && (
                <View style={styles.dateSection}>
                  <DatePicker 
                    value={dateRange.start}
                    onDateChange={setStartDate}
                    placeholder="Date de début"
                    style={styles.datePickerWrapper}
                    minimumDate={startMinimumDate}
                  />
                  <DatePicker 
                    value={dateRange.end}
                    onDateChange={setEndDate}
                    placeholder="Date de fin"
                    style={styles.datePickerWrapper}
                    minimumDate={endMinimumDate}
                  />
                  {(dateRange.start || dateRange.end) && (
                    <TouchableOpacity onPress={() => setDateRange({})} style={styles.clearDateButton}>
                      <Icon name="Close" size={16} color={theme.colors.mutedForeground} />
                      <Text style={styles.clearDateText}>Effacer</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>
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
  summaryList: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  summaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  summaryTextWrapper: {
    flex: 1,
    gap: 4,
  },
  summaryLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.foreground,
    fontWeight: theme.fontWeight.medium,
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
  dateSection: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  datePickerWrapper: {
    width: '100%',
  },
  clearDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  clearDateText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
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
  detailScreen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing['2xl'],
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailCloseButton: {
    padding: theme.spacing.sm,
  },
  detailHeaderSpacer: {
    width: 32,
  },
  detailTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.foreground,
  },
  detailContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
});
