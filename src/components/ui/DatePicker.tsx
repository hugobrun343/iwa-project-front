import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Icon } from './Icon';
import { theme } from '../../styles/theme';

interface DatePickerProps {
  value?: string; // Format: YYYY-MM-DD or DD/MM/YYYY
  onDateChange: (date: string) => void; // Returns YYYY-MM-DD format
  placeholder?: string;
  style?: any;
  minimumDate?: Date;
  maximumDate?: Date;
}

export function DatePicker({ 
  value, 
  onDateChange, 
  placeholder = "Sélectionner une date",
  style,
  minimumDate,
  maximumDate
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (value) {
      // Try to parse the date
      const parts = value.split(/[-\/]/);
      if (parts.length === 3) {
        // If format is DD/MM/YYYY, convert to Date
        if (parts[0].length === 2) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          return new Date(year, month, day);
        }
        // If format is YYYY-MM-DD
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }
    return new Date();
  });

  const formatDateForDisplay = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (date) {
      setSelectedDate(date);
      onDateChange(formatDateForAPI(date));
    }
  };

  const handleConfirm = () => {
    setShowPicker(false);
    onDateChange(formatDateForAPI(selectedDate));
  };

  return (
    <View style={style}>
      <TouchableOpacity 
        style={styles.trigger}
        onPress={() => setShowPicker(true)}
      >
        <Icon name="Calendar" size={16} color={theme.colors.mutedForeground} style={styles.icon} />
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {value ? formatDateForDisplay(selectedDate) : placeholder}
        </Text>
        <Icon name="ChevronRight" size={16} color={theme.colors.mutedForeground} />
      </TouchableOpacity>

      {Platform.OS === 'ios' && showPicker && (
        <Modal visible={showPicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={styles.cancelButton}>Annuler</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Sélectionner une date</Text>
                <TouchableOpacity onPress={handleConfirm}>
                  <Text style={styles.confirmButton}>Confirmer</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                locale="fr-FR"
              />
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.inputBackground,
    gap: theme.spacing.sm,
  },
  icon: {
    marginRight: theme.spacing.xs,
  },
  triggerText: {
    flex: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
  },
  placeholder: {
    color: theme.colors.mutedForeground,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  cancelButton: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
  confirmButton: {
    fontSize: theme.fontSize.base,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
});

