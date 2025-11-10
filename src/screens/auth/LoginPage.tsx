import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { useTranslation } from 'react-i18next';

interface LoginPageProps {
  allowSimulatedLogin?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ allowSimulatedLogin = false }) => {
  const { simulateLogin, login, isLoading } = useAuth();
  const { t } = useTranslation();

  const handleLogin = async () => {
    try {
      if (allowSimulatedLogin && simulateLogin) {
        await simulateLogin();
      } else {
        await login();
      }
    } catch (error) {
      console.error('Login failed:', error);
      Alert.alert('Erreur', 'Échec de la connexion. Veuillez réessayer.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Icon name="shield-checkmark" size={64} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>{t('login.title')}</Text>
          <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
        </View>

        {/* Login Card */}
        <Card style={styles.loginCard}>
          <CardContent style={styles.cardContent}>
            <View style={styles.loginHeader}>
              <Icon name="key" size={32} color={theme.colors.primary} />
              <Text style={styles.loginTitle}>{t('login.secureTitle')}</Text>
              <Text style={styles.loginDescription}>{t('login.secureDescription')}</Text>
            </View>

            {/* Standard Login Button */}
            <Button
              onPress={handleLogin}
              disabled={isLoading}
              style={styles.loginButton}
              size="lg"
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.loadingText}>{t('login.connecting')}</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Icon name="log-in" size={20} color="#ffffff" />
                  <Text style={styles.buttonText}>{t('login.connect')}</Text>
                </View>
              )}
            </Button>

            {/* Features List */}
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>Avec votre compte, vous pouvez :</Text>
              
              <View style={styles.featureItem}>
                <Icon name="checkmark-circle" size={16} color={theme.colors.primary} />
                <Text style={styles.featureText}>{t('login.featureCreate')}</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Icon name="checkmark-circle" size={16} color={theme.colors.primary} />
                <Text style={styles.featureText}>{t('login.featureSave')}</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Icon name="checkmark-circle" size={16} color={theme.colors.primary} />
                <Text style={styles.featureText}>{t('login.featureChat')}</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Icon name="checkmark-circle" size={16} color={theme.colors.primary} />
                <Text style={styles.featureText}>{t('login.featureProfile')}</Text>
              </View>
            </View>

            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <Icon name="shield-checkmark" size={16} color={theme.colors.mutedForeground} />
              <Text style={styles.securityText}>{t('login.securityNote')}</Text>
            </View>
          </CardContent>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('login.footer')}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 24,
  },
  loginCard: {
    marginBottom: theme.spacing.xl,
  },
  cardContent: {
    padding: theme.spacing.xl,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  loginTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.foreground,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  loginDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },
  loginButton: {
    marginBottom: theme.spacing.xl,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
  },
  featuresContainer: {
    marginBottom: theme.spacing.xl,
  },
  featuresTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  featureText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    flex: 1,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.muted + '30',
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  securityText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 16,
  },
});
