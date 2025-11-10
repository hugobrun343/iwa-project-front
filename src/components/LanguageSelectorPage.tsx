import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon } from './ui/Icon';
import { theme } from '../styles/theme';

interface LanguageSelectorPageProps {
  onBack: () => void;
}

export const LanguageSelectorPage: React.FC<LanguageSelectorPageProps> = ({ onBack }) => {
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', label: t('settings.languageEnglish'), sub: 'English' },
    { code: 'fr', label: t('settings.languageFrench'), sub: 'Français' },
  ];

  const [search, setSearch] = React.useState('');
  const [pendingLanguage, setPendingLanguage] = React.useState<string>(i18n.language);

  const filtered = languages.filter(l =>
    l.label.toLowerCase().includes(search.toLowerCase()) ||
    l.code.toLowerCase().includes(search.toLowerCase())
  );

  const applyLanguage = () => {
    if (!pendingLanguage || i18n.language.startsWith(pendingLanguage)) {
      return;
    }
    i18n.changeLanguage(pendingLanguage);
    onBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.languageSelectTitle')}</Text>
      </View>

      <View style={styles.content}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('settings.searchPlaceholder')}
          placeholderTextColor={theme.colors.mutedForeground}
          style={styles.searchInput}
        />

        <Text style={styles.sectionLabel}>{t('settings.allLanguages')}</Text>

        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          {filtered.map(language => {
            const selected = (pendingLanguage ?? i18n.language).startsWith(language.code);
            return (
              <TouchableOpacity
                key={language.code}
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => setPendingLanguage(language.code)}
              >
                <View style={styles.rowLeft}>
                  <View style={styles.countryBadge}>
                    <Text style={styles.countryBadgeText}>{language.code.toUpperCase()}</Text>
                  </View>
                  <View style={styles.texts}>
                    <Text style={styles.name}>{language.label}</Text>
                    <Text style={styles.sub}>{language.sub}</Text>
                  </View>
                </View>
                {selected && <Icon name="checkmark-circle" size={20} color={theme.colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (pendingLanguage ?? i18n.language) === i18n.language && styles.continueButtonDisabled
          ]}
          disabled={(pendingLanguage ?? i18n.language) === i18n.language}
          onPress={applyLanguage}
        >
          <Text style={styles.continueButtonText}>{t('settings.continue')}</Text>
        </TouchableOpacity>
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
    gap: theme.spacing.md,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background,
    color: theme.colors.foreground,
  },
  sectionLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.sm,
  },
  rowSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  countryBadge: {
    minWidth: 36,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
  },
  countryBadgeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    fontWeight: theme.fontWeight.medium,
    letterSpacing: 1,
  },
  texts: {
    gap: 2,
  },
  name: {
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    fontWeight: theme.fontWeight.medium,
  },
  sub: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  footer: {
    padding: theme.spacing.lg,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#ffffff',
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.base,
  },
});

