import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';
import { theme } from '../../styles/theme';

interface LabelProps extends TextProps {
  children: React.ReactNode;
  /** Affiche un astérisque rouge indiquant que le champ est obligatoire */
  required?: boolean;
}

export function Label({ children, style, required, ...props }: LabelProps) {
  return (
    <Text style={[styles.label, style]} {...props}>
      {children}
      {required && <Text style={styles.required}>*</Text>}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  required: {
    color: theme.colors.destructive,
    marginLeft: theme.spacing.xs,
    // keep it visually aligned with the label
    fontWeight: theme.fontWeight.bold,
  },
});
