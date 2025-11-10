import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { theme } from '../../styles/theme';

interface PaymentsPageProps {
  onBack: () => void;
}

export function PaymentsPage({ onBack }: PaymentsPageProps) {
  const paymentMethods = [
    {
      id: "1",
      type: "card",
      brand: "visa",
      last4: "4242",
      expiryMonth: "12",
      expiryYear: "2025",
      isDefault: true
    },
    {
      id: "2", 
      type: "card",
      brand: "mastercard",
      last4: "5555",
      expiryMonth: "08",
      expiryYear: "2026",
      isDefault: false
    }
  ];

  const transactions = [
    {
      id: "1",
      type: "payment_received",
      amount: 245,
      description: "Garde - Appartement moderne avec vue",
      date: "12 Jan 2024",
      status: "completed",
      from: "Marie Dubois"
    },
    {
      id: "2",
      type: "payment_received", 
      amount: 225,
      description: "Garde - Golden Retriever énergique",
      date: "25 Déc 2023",
      status: "completed",
      from: "Thomas Martin"
    },
    {
      id: "3",
      type: "subscription",
      amount: -9.99,
      description: "Abonnement Premium - Janvier 2024",
      date: "1 Jan 2024",
      status: "completed",
      to: "GuardHome"
    },
    {
      id: "4",
      type: "payment_received",
      amount: 140,
      description: "Garde - Jungle urbaine",
      date: "10 Nov 2023", 
      status: "completed",
      from: "Camille Leroy"
    }
  ];

  const PaymentMethodCard = ({ method }: { method: any }) => (
    <Card style={[styles.paymentCard, method.isDefault && styles.defaultCard]}>
      <CardContent style={styles.paymentContent}>
        <View style={styles.paymentHeader}>
          <View style={styles.cardInfo}>
            <View style={styles.cardBrand}>
              <Icon 
                name="card" 
                size={24} 
                color={method.brand === 'visa' ? '#1434CB' : '#EB001B'} 
              />
              <Text style={styles.brandText}>
                {method.brand === 'visa' ? 'Visa' : 'Mastercard'}
              </Text>
            </View>
            <Text style={styles.cardNumber}>•••• •••• •••• {method.last4}</Text>
            <Text style={styles.cardExpiry}>Expire {method.expiryMonth}/{method.expiryYear}</Text>
          </View>
          
          <View style={styles.cardActions}>
            {method.isDefault && (
              <Badge variant="outline" style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Par défaut</Text>
              </Badge>
            )}
            <TouchableOpacity style={styles.moreButton}>
              <Icon name="ellipsis-vertical" size={20} color={theme.colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </CardContent>
    </Card>
  );

  const TransactionCard = ({ transaction }: { transaction: any }) => (
    <Card style={styles.transactionCard}>
      <CardContent style={styles.transactionContent}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionIcon}>
            <Icon 
              name={
                transaction.type === 'payment_received' ? 'arrow-down' :
                transaction.type === 'subscription' ? 'card' : 'swap-horizontal'
              }
              size={20} 
              color={transaction.amount > 0 ? '#22c55e' : '#ef4444'} 
            />
          </View>
          
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionDescription}>{transaction.description}</Text>
            <Text style={styles.transactionMeta}>
              {transaction.from && `De ${transaction.from} • `}
              {transaction.to && `À ${transaction.to} • `}
              {transaction.date}
            </Text>
          </View>
          
          <View style={styles.transactionAmount}>
            <Text style={[
              styles.amountText,
              { color: transaction.amount > 0 ? '#22c55e' : '#ef4444' }
            ]}>
              {transaction.amount > 0 ? '+' : ''}{transaction.amount}€
            </Text>
            <Badge 
              variant="outline" 
              style={[
                styles.statusBadge,
                transaction.status === 'completed' && styles.completedBadge
              ]}
            >
              <Text style={[
                styles.statusText,
                transaction.status === 'completed' && styles.completedText
              ]}>
                {transaction.status === 'completed' ? 'Terminé' : 'En attente'}
              </Text>
            </Badge>
          </View>
        </View>
      </CardContent>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paiements</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Payment Methods */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Moyens de paiement</Text>
            <TouchableOpacity>
              <Text style={styles.addButton}>Ajouter</Text>
            </TouchableOpacity>
          </View>
          
          {paymentMethods.map((method) => (
            <PaymentMethodCard key={method.id} method={method} />
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transactions récentes</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllButton}>Tout voir</Text>
            </TouchableOpacity>
          </View>
          
          {transactions.map((transaction) => (
            <TransactionCard key={transaction.id} transaction={transaction} />
          ))}
        </View>

        {/* Settings */}
        <Card style={styles.settingsCard}>
          <CardContent style={styles.settingsContent}>
            <Text style={styles.sectionTitle}>Paramètres de paiement</Text>
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Icon name="notifications" size={20} color={theme.colors.mutedForeground} />
                <Text style={styles.settingText}>Notifications de paiement</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Icon name="shield-checkmark" size={20} color={theme.colors.mutedForeground} />
                <Text style={styles.settingText}>Sécurité et vérifications</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Icon name="document-text" size={20} color={theme.colors.mutedForeground} />
                <Text style={styles.settingText}>Reçus et factures</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Icon name="help-circle" size={20} color={theme.colors.mutedForeground} />
                <Text style={styles.settingText}>Aide et support</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
            </TouchableOpacity>
          </CardContent>
        </Card>
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
  addButton: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  viewAllButton: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  paymentCard: {
    marginBottom: theme.spacing.md,
  },
  defaultCard: {
    borderColor: theme.colors.primary,
  },
  paymentContent: {
    padding: theme.spacing.lg,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
  },
  cardBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  brandText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
  },
  cardNumber: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  cardExpiry: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  cardActions: {
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  defaultBadge: {
    backgroundColor: theme.colors.primary + '10',
    borderColor: theme.colors.primary,
  },
  defaultText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
  },
  moreButton: {
    padding: theme.spacing.xs,
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
  completedText: {
    color: '#22c55e',
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
});