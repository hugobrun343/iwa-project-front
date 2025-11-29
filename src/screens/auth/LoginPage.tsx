import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
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
      {/* Modern Background */}
      <View style={styles.backgroundContainer}>
        <View style={styles.backgroundShape1} />
        <View style={styles.backgroundShape2} />
        <View style={styles.backgroundShape3} />
        <View style={styles.backgroundShape4} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('login.title')}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            onPress={handleLogin}
            disabled={isLoading}
            style={styles.loginButton}
            textStyle={styles.buttonText}
            size="lg"
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.loadingText}>{t('login.connecting')}</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>{t('login.connect')}</Text>
            )}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.muted,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  backgroundShape1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: theme.colors.primary + '35',
    top: -100,
    right: -100,
  },
  backgroundShape2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: theme.colors.secondary + '30',
    bottom: -80,
    left: -80,
  },
  backgroundShape3: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.primary + '25',
    top: '40%',
    left: -50,
  },
  backgroundShape4: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: theme.colors.secondary + '28',
    bottom: '30%',
    right: -40,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'space-between',
    paddingTop: theme.spacing['4xl'],
    paddingBottom: theme.spacing['4xl'],
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
    letterSpacing: -0.5,
  },
  buttonContainer: {
    width: '100%',
  },
  loginButton: {
    width: '100%',
    minHeight: 48,
    paddingVertical: theme.spacing.md,
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
  buttonText: {
    color: '#ffffff',
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
  },
});
