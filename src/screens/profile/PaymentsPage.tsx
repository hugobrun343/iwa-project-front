import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { theme } from '../../styles/theme';
import { DEFAULT_BASE_URL } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

interface PaymentsPageProps {
  onBack: () => void;
}

type Payout = {
  paymentId: string;
  jobId: string | null;
  amount: number;
  currency: string;
  status: string;
  created: string;
  source: string | null;
  invoiceId?: string | null;
  subscriptionId?: string | null;
};

type TransactionItem = {
  id: string;
  description: string;
  meta: string;
  amountText: string;
  status: string;
  isPositive: boolean;
};

const STATUS_STYLES: Record<
  string,
  { label: string; badgeBg: string; badgeBorder: string; textColor: string }
> = {
  succeeded: {
    label: 'Réussi',
    badgeBg: '#f0fdf4',
    badgeBorder: '#bbf7d0',
    textColor: '#15803d',
  },
  requires_payment_method: {
    label: 'Action requise',
    badgeBg: '#fff7ed',
    badgeBorder: '#fed7aa',
    textColor: '#c2410c',
  },
  processing: {
    label: 'En cours',
    badgeBg: '#ecfeff',
    badgeBorder: '#bae6fd',
    textColor: '#0ea5e9',
  },
  canceled: {
    label: 'Annulé',
    badgeBg: '#fef2f2',
    badgeBorder: '#fecaca',
    textColor: '#b91c1c',
  },
};

export function PaymentsPage({ onBack }: PaymentsPageProps) {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const gatewayUrl = (process.env.EXPO_PUBLIC_GATEWAY_URL || DEFAULT_BASE_URL || '').replace(/\/$/, '');
  const userId = 'cus_TTD51FIIZVBdet';
  const { accessToken } = useAuth();

  const fetchPayouts = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const response = await fetch(
        `${gatewayUrl}/api/payments/payouts?userId=${encodeURIComponent(userId)}`,
        {
          headers: {
            Accept: 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        },
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          text ||
            (response.status === 401
              ? 'Session expirée, veuillez vous reconnecter.'
              : `Impossible de charger les transactions (HTTP ${response.status})`),
        );
      }

      const data = await response.json();
      setPayouts(Array.isArray(data?.payouts) ? data.payouts : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Erreur lors du chargement des paiements:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Impossible de charger les transactions.');
      setPayouts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [accessToken, gatewayUrl, userId]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPayouts();
  };

  const formatAmount = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: (currency || 'EUR').toUpperCase(),
    });

    return formatter.format((amount || 0) / 100);
  };

  const formatDate = (value: string) => {
    if (!value) return 'Date inconnue';
    try {
      return new Date(value).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return value;
    }
  };

  const transactions: TransactionItem[] = useMemo(
    () =>
      payouts.map((payout) => ({
        id: payout.paymentId,
        description:
          payout.source === 'subscription'
            ? 'Abonnement Premium'
            : payout.jobId
            ? `Mission #${payout.jobId}`
            : 'Paiement',
        meta: [
          payout.subscriptionId ? `Abonnement ${payout.subscriptionId}` : null,
          payout.invoiceId ? `Facture ${payout.invoiceId}` : null,
          formatDate(payout.created),
        ]
          .filter(Boolean)
          .join(' • '),
        amountText: formatAmount(payout.amount, payout.currency),
        status: payout.status,
        isPositive: payout.amount >= 0,
      })),
    [payouts],
  );

  const TransactionCard = ({ transaction }: { transaction: TransactionItem }) => {
    const statusInfo =
      STATUS_STYLES[transaction.status] ||
      STATUS_STYLES.processing;

    return (
    <Card style={styles.transactionCard}>
      <CardContent style={styles.transactionContent}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionIcon}>
            <Icon 
              name={transaction.isPositive ? 'arrow-down' : 'arrow-up'}
              size={20} 
              color={transaction.isPositive ? '#22c55e' : '#ef4444'} 
            />
          </View>
          
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionDescription}>{transaction.description}</Text>
            <Text style={styles.transactionMeta}>{transaction.meta}</Text>
          </View>
          
          <View style={styles.transactionAmount}>
            <Text style={[
              styles.amountText,
              { color: transaction.isPositive ? '#22c55e' : '#ef4444' }
            ]}>
              {transaction.amountText}
            </Text>
            <Badge 
              variant="outline" 
              style={[
                styles.statusBadge,
                {
                  backgroundColor: statusInfo.badgeBg,
                  borderColor: statusInfo.badgeBorder,
                },
              ]}
            >
              <Text style={[
                styles.statusText,
                { color: statusInfo.textColor }
              ]}>
                {statusInfo.label}
              </Text>
            </Badge>
          </View>
        </View>
      </CardContent>
    </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paiements</Text>
          <TouchableOpacity onPress={handleRefresh} disabled={isRefreshing} style={styles.refreshButton}>
            <Icon name={isRefreshing ? 'refresh' : 'refresh'} size={20} color={theme.colors.primary} />
            <Text style={[styles.refreshText, isRefreshing && styles.refreshTextDisabled]}>
              {isRefreshing ? 'Actualisation...' : 'Actualiser'}
            </Text>
          </TouchableOpacity>
        </View>
        {lastUpdated && (
          <Text style={styles.lastUpdatedText}>
            Mis à jour le {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(lastUpdated)}
          </Text>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transactions récentes</Text>
            <View style={styles.sectionActions}>
              {errorMessage && (
                <Text style={styles.errorText}>
                  {errorMessage}
                </Text>
              )}
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Chargement des transactions...</Text>
            </View>
          ) : payouts.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="card" size={32} color={theme.colors.mutedForeground} />
              <Text style={styles.emptyTitle}>Aucune transaction</Text>
              <Text style={styles.emptySubtitle}>
                Vos transactions récentes apparaîtront ici dès qu'elles seront disponibles.
              </Text>
            </View>
          ) : (
            transactions.map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    flex: 1,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  refreshText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  refreshTextDisabled: {
    color: theme.colors.mutedForeground,
  },
  lastUpdatedText: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  scrollView: {
    flex: 1,
  },
  balanceCard: {
    margin: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  balanceContent: {
    padding: theme.spacing.xl,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  balanceLabel: {
    fontSize: theme.fontSize.sm,
    color: '#ffffff99',
  },
  balanceAmount: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: '#ffffff',
    marginBottom: theme.spacing.xs,
  },
  balanceSubtext: {
    fontSize: theme.fontSize.sm,
    color: '#ffffff99',
    marginBottom: theme.spacing.lg,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  withdrawButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  withdrawText: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  historyButton: {
    flex: 1,
    borderColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  historyText: {
    color: '#ffffff',
    fontWeight: theme.fontWeight.medium,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
  },
  sectionActions: {
    alignItems: 'flex-end',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: theme.fontSize.sm,
  },
  viewAllButton: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  transactionCard: {
    marginBottom: theme.spacing.md,
  },
  transactionContent: {
    padding: theme.spacing.lg,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  transactionMeta: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  completedBadge: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  statusText: {
    fontSize: theme.fontSize.xs,
  },
  settingsCard: {
    margin: theme.spacing.lg,
    marginBottom: 80, // Reduced space for bottom nav
  },
  settingsContent: {
    padding: theme.spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  settingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.foreground,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  emptySubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
});