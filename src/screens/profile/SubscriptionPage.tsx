import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { PageHeader } from '../../components/ui/PageHeader';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';
import { usePrices, useSubscribe } from '../../hooks/api/useStripeApi';
import { PREMIUM_PRICE_ID, BACKEND_URL } from '../../config/config';
import { useUserApi } from '../../hooks/api/useUserApi';
import { useTranslation } from 'react-i18next';

interface SubscriptionPageProps {
  onBack: () => void;
}

export function SubscriptionPage({ onBack }: SubscriptionPageProps) {
  const { t } = useTranslation();
  const { user, accessToken } = useAuth();
  const { getMyProfile } = useUserApi();
  const [profileDetails, setProfileDetails] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | undefined>(undefined);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  
  // Load customerId from storage
  useEffect(() => {
    const loadCustomerId = async () => {
      const id = await AsyncStorage.getItem('customerId');
      setCustomerId(id);
    };
    loadCustomerId();
  }, []);

  const { prices, currentPriceId, activeSubscriptionId, loading: subscriptionLoading, cancelAtPeriodEnd, currentPeriodEnd, subscribeTo, cancelSubscription } = usePrices(BACKEND_URL, accessToken);

  const handlePaymentSuccess = () => {
    setIsProcessingPayment(false);
    setClientSecret(undefined);
    setProcessingPlanId(null);
    Alert.alert(t('common.success'), t('subscription.errors.success'));
  };

  const handlePaymentError = (error: any) => {
    setIsProcessingPayment(false);
    setClientSecret(undefined);
    setProcessingPlanId(null);
    
    // Only show alert if it's not a user cancellation
    // Stripe returns error code 'Canceled' or message containing 'cancel' for user cancellations
    const isCancellation = error?.code === 'Canceled' || 
                          error?.message?.toLowerCase().includes('cancel') ||
                          error?.type === 'Canceled';
    
    if (!isCancellation) {
      Alert.alert(t('common.error'), error?.message || t('subscription.errors.errorSubscribing'));
    }
  };

  useSubscribe(clientSecret, handlePaymentSuccess, handlePaymentError);

  useEffect(() => {
    const loadProfile = async () => {
      if (accessToken) {
        try {
          const details = await getMyProfile();
          if (details) {
            setProfileDetails(details);
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }
    };
    loadProfile();
  }, [getMyProfile, accessToken]);

  // Check if user has premium subscription
  const isPremium = useMemo(() => {
    if (!prices || !currentPriceId) return false;
    // Check if current price is a recurring subscription (not free)
    const currentPrice = prices.find(p => p.id === currentPriceId);
    return currentPrice && currentPrice.type === 'recurring' && !cancelAtPeriodEnd;
  }, [prices, currentPriceId, cancelAtPeriodEnd]);

  // Format price from cents to euros
  const formatPrice = (priceCents?: number | null) => {
    if (!priceCents) return '0';
    return (priceCents / 100).toFixed(2);
  };

  // Get interval label from recurring object
  const getIntervalLabel = (recurring?: { interval: string; interval_count: number } | null) => {
    if (!recurring || !recurring.interval) return t('subscription.plans.perMonth');
    const interval = recurring.interval.toLowerCase();
    const count = recurring.interval_count || 1;
    
    switch (interval) {
      case 'month':
        return t('subscription.plans.perMonth');
      case 'year':
        return t('subscription.plans.perYear');
      case 'day':
        return t('subscription.plans.perDay');
      case 'week':
        return t('subscription.plans.perWeek');
      default:
        return interval;
    }
  };

  // Handle subscription to a plan
  const handleSubscribe = async (priceId: string, planName: string) => {
    if (isProcessingPayment) return;

    try {
      setIsProcessingPayment(true);
      setProcessingPlanId(priceId);

      // Check if customer exists
      let customerId = await AsyncStorage.getItem('customerId');

      // If no customer, create one
      if (!customerId) {
        const userEmail = profileDetails?.email ?? user?.email ?? '';
        if (!userEmail) {
          Alert.alert(t('common.error'), t('subscription.errors.completeEmail'));
          setIsProcessingPayment(false);
          setProcessingPlanId(null);
          return;
        }

        // Get name and phone from profile
        const firstName = profileDetails?.firstName ?? user?.firstName ?? '';
        const lastName = profileDetails?.lastName ?? user?.lastName ?? '';
        const fullName = `${firstName} ${lastName}`.trim() || user?.fullName || user?.username || t('common.user');
        const phone = profileDetails?.phoneNumber ?? user?.telephone ?? '';

        // Create customer directly with email, name, and phone
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          if (accessToken) {
            headers.Authorization = `Bearer ${accessToken}`;
          }

          const res = await fetch(`${BACKEND_URL}/api/payments/create-customer`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              email: userEmail,
              name: fullName,
              phone: phone || undefined
            })
          });
          const json = await res.json();
          if (res.ok && json.customerId) {
            await AsyncStorage.setItem('customerId', json.customerId);
            customerId = json.customerId;
            setCustomerId(json.customerId); // Update state
          } else {
            throw new Error(json.message || t('subscription.errors.errorCreatingCustomer'));
          }
        } catch (error: any) {
          throw new Error(error.message || t('subscription.errors.errorCreatingCustomer'));
        }
      }

      // Subscribe to plan
      const result = await subscribeTo(priceId);

      // If clientSecret is returned, we need to show payment sheet
      if (result?.clientSecret) {
        setClientSecret(result.clientSecret);
        // Payment sheet will be presented automatically by useSubscribe hook
      } else {
        // Free subscription or already paid
        setIsProcessingPayment(false);
        setProcessingPlanId(null);
        Alert.alert(t('common.success'), t('subscription.errors.success'));
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      Alert.alert(t('common.error'), error.message || t('subscription.errors.errorSubscribing'));
      setIsProcessingPayment(false);
      setClientSecret(undefined);
      setProcessingPlanId(null);
    }
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!activeSubscriptionId) {
      Alert.alert(t('common.error'), t('subscription.errors.noActiveSubscription'));
      return;
    }

    Alert.alert(
      t('subscription.plans.cancelConfirm'),
      t('subscription.plans.cancelMessage'),
      [
        { text: t('subscription.plans.no'), style: 'cancel' },
        {
          text: t('subscription.plans.yesCancel'),
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Cancelling subscription:', activeSubscriptionId);
              await cancelSubscription(activeSubscriptionId);
              Alert.alert(t('common.success'), t('subscription.plans.cancelSuccess'));
              // Reload subscription data after cancellation
              // The usePrices hook should automatically refresh
            } catch (error: any) {
              console.error('Cancel subscription error:', error);
              Alert.alert(t('common.error'), error.message || t('subscription.plans.cancelError'));
            }
          }
        }
      ]
    );
  };

  // Format date
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Define available plans
  const availablePlans = useMemo(() => {
    const plans: any[] = [];

    // Free plan (always available)
    plans.push({
      id: 'free',
      priceId: null,
      name: t('subscription.plans.free.name'),
      price: 0,
      priceCents: 0,
      interval: 'month',
      current: !currentPriceId || currentPriceId === 'free',
      features: [
        t('subscription.plans.free.features.0'),
        t('subscription.plans.free.features.1'),
        t('subscription.plans.free.features.2'),
        t('subscription.plans.free.features.3')
      ],
      limitations: [
        t('subscription.plans.free.limitations.0'),
        t('subscription.plans.free.limitations.1'),
        t('subscription.plans.free.limitations.2')
      ]
    });

    // Add plans from Stripe prices (only recurring subscriptions)
    if (prices && prices.length > 0) {
      prices.forEach((price) => {
        // Only include recurring subscriptions
        if (price.type !== 'recurring' || !price.recurring) return;
        
        const isCurrent = currentPriceId === price.id && !cancelAtPeriodEnd;
        const isPremium = price.lookup_key === 'premium_subscription' || 
                         (price.nickname && price.nickname.toLowerCase().includes('premium'));
        
        plans.push({
          id: price.id,
          priceId: price.id,
          name: price.nickname || price.product?.name || t('subscription.plans.premium.name'),
          price: parseFloat(formatPrice(price.unit_amount)),
          priceCents: price.unit_amount || 0,
          recurring: price.recurring,
          interval: price.recurring.interval,
          intervalCount: price.recurring.interval_count || 1,
          current: isCurrent,
          popular: isPremium,
          features: [
            t('subscription.plans.premium.features.0'),
            t('subscription.plans.premium.features.1'),
            t('subscription.plans.premium.features.2'),
            t('subscription.plans.premium.features.3'),
            t('subscription.plans.premium.features.4'),
            t('subscription.plans.premium.features.5'),
            t('subscription.plans.premium.features.6'),
            t('subscription.plans.premium.features.7'),
            t('subscription.plans.premium.features.8'),
            t('subscription.plans.premium.features.9')
          ],
          limitations: []
        });
      });
    }

    return plans;
  }, [prices, currentPriceId, cancelAtPeriodEnd]);

  const PlanCard = ({ plan }: { plan: any }) => {
    const isProcessing = isProcessingPayment && processingPlanId === plan.priceId;
    const isCurrent = plan.current;
    const canSubscribe = !isCurrent && plan.priceId && !isProcessingPayment;

    return (
      <Card style={StyleSheet.flatten([
        styles.planCard,
        isCurrent && styles.currentPlan,
        plan.popular && styles.popularPlan
      ])}>
        <CardContent style={styles.planContent}>
          {plan.popular && !isCurrent && (
            <Badge style={styles.popularBadge}>
              <Text style={styles.popularText}>{t('subscription.plans.popular')}</Text>
            </Badge>
          )}

          <View style={styles.planHeader}>
            <Text style={styles.planName}>{plan.name}</Text>
            {isCurrent && (
              <Badge variant="outline" style={styles.currentBadge}>
                <Text style={styles.currentText}>{t('subscription.plans.current')}</Text>
              </Badge>
            )}
            {cancelAtPeriodEnd && isCurrent && (
              <Badge variant="outline" style={styles.cancellingBadge}>
                <Text style={styles.cancellingText}>{t('subscription.plans.cancelling')}</Text>
              </Badge>
            )}
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              {plan.price === 0 ? t('subscription.plans.free.name') : `${plan.price}€`}
            </Text>
            {plan.price > 0 && (
              <Text style={styles.period}>/{getIntervalLabel(plan.recurring || { interval: plan.interval || 'month', interval_count: plan.intervalCount || 1 })}</Text>
            )}
          </View>

          {isCurrent && currentPeriodEnd && (
            <View style={styles.periodInfo}>
              <Text style={styles.periodInfoText}>
                {t('subscription.plans.renewal', { date: formatDate(currentPeriodEnd) })}
              </Text>
            </View>
          )}

          <View style={styles.featuresContainer}>
            {plan.features.map((feature: string, index: number) => (
              <View key={index} style={styles.feature}>
                <Icon name="checkmark" size={16} color="#22c55e" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}

            {plan.limitations.map((limitation: string, index: number) => (
              <View key={index} style={styles.limitation}>
                <Icon name="close" size={16} color="#ef4444" />
                <Text style={styles.limitationText}>{limitation}</Text>
              </View>
            ))}
          </View>

          {isCurrent && activeSubscriptionId && (
            <Button
              style={styles.cancelButton}
              variant="outline"
              onPress={handleCancelSubscription}
              disabled={isProcessingPayment}
            >
              <Text style={styles.cancelButtonText}>{t('subscription.plans.cancel')}</Text>
            </Button>
          )}

          {canSubscribe && (
            <Button
              style={StyleSheet.flatten([
                styles.planButton,
                plan.popular && styles.popularPlanButton
              ])}
              onPress={() => handleSubscribe(plan.priceId, plan.name)}
              disabled={isProcessingPayment}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.planButtonText}>
                  {t('subscription.plans.upgrade', { name: plan.name })}
                </Text>
              )}
            </Button>
          )}

          {isCurrent && !activeSubscriptionId && (
            <Button
              style={styles.planButton}
              variant="outline"
              disabled
            >
              <Text style={styles.currentPlanButtonText}>{t('subscription.plans.current')}</Text>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title={t('subscription.title')}
        icon="star"
        showBackButton
        onBack={onBack}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {subscriptionLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{t('subscription.loading')}</Text>
          </View>
        ) : (
          <>
            {/* Current Subscription Info */}
            {isPremium && (
              <Card style={styles.currentSubscriptionCard}>
                <CardContent style={styles.currentSubscriptionContent}>
                  <View style={styles.currentSubscriptionHeader}>
                    <Icon name="star" size={24} color={theme.colors.primary} />
                    <Text style={styles.currentSubscriptionTitle}>{t('subscription.current.title')}</Text>
                  </View>
                  {currentPeriodEnd && (
                    <Text style={styles.currentSubscriptionText}>
                      {t('subscription.current.renewal', { date: formatDate(currentPeriodEnd) })}
                    </Text>
                  )}
                  {cancelAtPeriodEnd && (
                    <Text style={styles.cancellingText}>
                      {t('subscription.current.cancelling', { date: formatDate(currentPeriodEnd) })}
                    </Text>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Plans */}
            <View style={styles.plansContainer}>
              <Text style={styles.sectionTitle}>{t('subscription.plans.title')}</Text>
              {availablePlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </View>

            {/* FAQ */}
            <Card style={styles.faqCard}>
              <CardContent style={styles.faqContent}>
                <Text style={styles.sectionTitle}>{t('subscription.faq.title')}</Text>

                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>{t('subscription.faq.canCancel')}</Text>
                  <Text style={styles.faqAnswer}>
                    {t('subscription.faq.canCancelAnswer')}
                  </Text>
                </View>

                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>{t('subscription.faq.whatIfCancel')}</Text>
                  <Text style={styles.faqAnswer}>
                    {t('subscription.faq.whatIfCancelAnswer')}
                  </Text>
                </View>

                <View style={styles.faqItem}>
                  <Text style={styles.faqQuestion}>{t('subscription.faq.trial')}</Text>
                  <Text style={styles.faqAnswer}>
                    {t('subscription.faq.trialAnswer')}
                  </Text>
                </View>
              </CardContent>
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: theme.spacing['4xl'],
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  currentSubscriptionCard: {
    margin: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary + '05',
    borderColor: theme.colors.primary + '20',
  },
  currentSubscriptionContent: {
    padding: theme.spacing.lg,
  },
  currentSubscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  currentSubscriptionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
  },
  currentSubscriptionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.lg,
  },
  plansContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  planCard: {
    marginBottom: theme.spacing.lg,
  },
  currentPlan: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  popularPlan: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  planContent: {
    padding: theme.spacing.lg,
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  popularText: {
    color: '#ffffff',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  planName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.foreground,
  },
  currentBadge: {
    backgroundColor: theme.colors.muted,
  },
  currentText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  cancellingBadge: {
    borderColor: '#ef4444',
    backgroundColor: '#fee2e2',
  },
  cancellingText: {
    fontSize: theme.fontSize.xs,
    color: '#ef4444',
    marginTop: theme.spacing.xs,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing.md,
  },
  price: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  period: {
    fontSize: theme.fontSize.md,
    color: theme.colors.mutedForeground,
    marginLeft: theme.spacing.xs,
  },
  periodInfo: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.muted + '30',
    borderRadius: theme.borderRadius.md,
  },
  periodInfoText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  featuresContainer: {
    marginBottom: theme.spacing.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  featureText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    flex: 1,
  },
  limitation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  limitationText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    flex: 1,
  },
  planButton: {
    width: '100%',
  },
  popularPlanButton: {
    backgroundColor: theme.colors.primary,
  },
  planButtonText: {
    color: '#ffffff',
    fontWeight: theme.fontWeight.medium,
  },
  currentPlanButtonText: {
    color: theme.colors.mutedForeground,
  },
  cancelButton: {
    width: '100%',
    marginTop: theme.spacing.sm,
    borderColor: '#ef4444',
  },
  cancelButtonText: {
    color: '#ef4444',
    fontWeight: theme.fontWeight.medium,
  },
  faqCard: {
    margin: theme.spacing.lg,
    marginBottom: 80,
  },
  faqContent: {
    padding: theme.spacing.lg,
  },
  faqItem: {
    marginBottom: theme.spacing.lg,
  },
  faqQuestion: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  faqAnswer: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    lineHeight: 20,
  },
});
