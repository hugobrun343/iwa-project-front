import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from './ui/Icon';
import { Card, CardContent } from './ui/Card';
import { theme } from '../styles/theme';

interface AdvancedSettingsPageProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export const AdvancedSettingsPage: React.FC<AdvancedSettingsPageProps> = ({ onBack, onNavigate }) => {
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', label: t('settings.languageEnglish') },
    { code: 'fr', label: t('settings.languageFrench') },
  ];

  const handleLanguageChange = (code: string) => {
    if (i18n.language === code) return;
    i18n.changeLanguage(code);
  };

  const currentLanguageLabel =
    languages.find(lang => i18n.language.startsWith(lang.code))?.label ||
    (i18n.language === 'fr' ? t('settings.languageFrench') : t('settings.languageEnglish'));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.advancedTitle')}</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.sectionCard}>
          <CardContent style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => onNavigate?.('language-selector')}
            >
              <View style={styles.settingRowLeft}>
                <Text style={styles.sectionTitle}>{t('settings.languageTitle')}</Text>
                <Text style={styles.currentValue}>{currentLanguageLabel}</Text>
              </View>
              <Icon name="ChevronRight" size={18} color={theme.colors.mutedForeground} />
            </TouchableOpacity>
          </CardContent>
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.foreground,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionCard: {
    marginTop: theme.spacing.lg,
  },
  sectionContent: {
    gap: theme.spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  settingRowLeft: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.foreground,
  },
  currentValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  sectionDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    lineHeight: 20,
  },
  languageList: {
    gap: theme.spacing.sm,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  languageOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '08',
  },
  languageInfo: {
    gap: theme.spacing.xs,
  },
  languageLabel: {
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    fontWeight: theme.fontWeight.medium,
  },
  languageCode: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    letterSpacing: 1,
  },
});

