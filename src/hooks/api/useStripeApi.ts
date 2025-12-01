import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStripe } from '@stripe/stripe-react-native';
import { BACKEND_URL, DEMO_IDS, PREMIUM_PRICE_ID } from '../../config/config';

// Helper function to create headers with auth token
const createHeaders = (accessToken?: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
};

// Types
type Transfer = { transferId: string; amount: number; currency: string; created: string; status: string; metadata?: any };
type Tx = { paymentId: string; jobId: number; amount: number | null; currency: string; status: string; created?: string };
type Job = {
  id: string;
  amountCents?: number;
  paymentId?: string;
  status: 'unpaid' | 'authorized' | 'captured' | 'refunded' | 'failed';
};
type Price = {
  id: string;
  object: string;
  active: boolean;
  billing_scheme: string;
  created: number;
  currency: string;
  custom_unit_amount?: any;
  livemode: boolean;
  lookup_key?: string | null;
  metadata: Record<string, any>;
  nickname?: string | null;
  product: {
    id: string;
    name: string;
    description?: string;
    images?: string[];
  };
  recurring?: {
    aggregate_usage?: string | null;
    interval: string;
    interval_count: number;
    meter?: string | null;
    trial_period_days?: number | null;
    usage_type: string;
  } | null;
  tax_behavior?: string;
  tiers_mode?: string | null;
  transform_quantity?: any;
  type: 'one_time' | 'recurring';
  unit_amount: number | null;
  unit_amount_decimal: string | null;
};

type UseJobAdminProps = {
  backendUrl?: string;
  initialPaymentId?: string;
  onUpdated?: () => void;
};

type UseOwnerPayProps = {
  backendUrl?: string;
  jobId: string;
  initialAmountCents?: number;
  onPaid?: (paymentId: string, amountCents: number) => void;
};

// useGuardianPayouts
export function useGuardianPayouts(backendUrl = BACKEND_URL, guardianId?: string) {
  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState<Transfer[] | null>(null);
  const [guardianEmail, setGuardianEmail] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        if (!guardianId) return;
        const res = await fetch(`${backendUrl}/connect/transfers/${encodeURIComponent(guardianId)}`);
        const json = await res.json();
        if (mounted) {
          setTransfers(json.transfers || []);
          setGuardianEmail(json.email || '');
        }
      } catch (e) {
        console.warn('useGuardianPayouts', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [backendUrl, guardianId]);

  return { loading, transfers, guardianEmail } as const;
}

// useJobAdmin
export function useJobAdmin({ backendUrl = BACKEND_URL, initialPaymentId = '', onUpdated }: UseJobAdminProps) {
  const [paymentId, setPaymentId] = useState(initialPaymentId);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!paymentId.trim()) return; 
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/payments/${paymentId}`);
      const json = await res.json();
      if (res.ok) {
        setStatus(json.status);
        setAmount(json.amount);
      }
    } catch (e) {
      console.warn('fetchStatus', e);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, paymentId]);

  const release = useCallback(async () => {
    if (!paymentId.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/payments/release`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId })
      });
      const json = await res.json();
      if (res.ok) {
        onUpdated?.();
        await fetchStatus();
      } else {
        console.warn('release failed', json);
      }
      return json;
    } catch (e) {
      console.warn('release', e);
      throw e;
    } finally { setLoading(false); }
  }, [backendUrl, paymentId, fetchStatus, onUpdated]);

  const refund = useCallback(async () => {
    if (!paymentId.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/payments/refund`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId })
      });
      const json = await res.json();
      if (res.ok) {
        onUpdated?.();
        await fetchStatus();
      } else {
        console.warn('refund failed', json);
      }
      return json;
    } catch (e) {
      console.warn('refund', e);
      throw e;
    } finally { setLoading(false); }
  }, [backendUrl, paymentId, fetchStatus, onUpdated]);

  return {
    paymentId,
    setPaymentId,
    loading,
    status,
    amount,
    fetchStatus,
    release,
    refund,
  } as const;
}

// useJobMock
export function useJobMock(backendUrl: string = BACKEND_URL) {
  const [jobs, setJobs] = useState<Job[]>([
    { id: 'job_mock_1', status: 'unpaid' },
    { id: 'job_mock_2', status: 'unpaid' },
    { id: 'job_mock_3', status: 'unpaid' },
    { id: 'job_mock_4', status: 'unpaid' },
    { id: 'job_mock_5', status: 'unpaid' },
  ]);

  const updateJob = useCallback((id: string, patch: Partial<Job>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  const onPaid = useCallback((jobId: string) => (paymentId: string, amountCents: number) => {
    updateJob(jobId, { paymentId, amountCents, status: 'authorized' });
  }, [updateJob]);

  const releaseFunds = useCallback((jobId: string) => async () => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job?.paymentId) throw new Error('Aucun paymentId');
    const res = await fetch(`${backendUrl}/api/payments/release`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId: job.paymentId })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Erreur release');
    updateJob(jobId, { status: 'captured' });
    return json;
  }, [backendUrl, jobs, updateJob]);

  const refundPayment = useCallback((jobId: string) => async () => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job?.paymentId) throw new Error('Aucun paymentId');
    const res = await fetch(`${backendUrl}/api/payments/refund`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId: job.paymentId })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Erreur refund');
    updateJob(jobId, { status: 'refunded' });
    return json;
  }, [backendUrl, jobs, updateJob]);

  return { jobs, updateJob, onPaid, releaseFunds, refundPayment } as const;
}

// useOwnerPay
export function useOwnerPay({ backendUrl = BACKEND_URL, jobId, initialAmountCents = 0, onPaid }: UseOwnerPayProps) {
  const [amount, setAmount] = useState((initialAmountCents ?? 0) / 100 + '');
  const [loading, setLoading] = useState(false);

  const createHoldAndPay = useCallback(async () => {
    const value = parseFloat(amount.replace(',', '.')) || 0;
    const cents = Math.round(value * 100);
    if (cents <= 0) throw new Error('Montant invalide');
    setLoading(true);
    try {
      const customerId = await AsyncStorage.getItem('customerId');
      const res = await fetch(`${backendUrl}/api/payments/create-hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, amount: cents, customerId: customerId || undefined, guardianId: DEMO_IDS.GUARDIAN_USER_ID }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Impossible de créer la réservation de paiement');
      }
      const paymentId = json.paymentId;
      const clientSecret = json.clientSecret;
      return { paymentId, clientSecret, cents };
    } finally { setLoading(false); }
  }, [amount, backendUrl, jobId]);

  return { amount, setAmount, loading, createHoldAndPay } as const;
}

// usePrices
export function usePrices(backendUrl = BACKEND_URL, accessToken?: string | null) {
  const [prices, setPrices] = useState<Price[] | null>(null);
  const [currentPriceId, setCurrentPriceId] = useState<string | null>(null);
  const [activeSubscriptionId, setActiveSubscriptionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState<boolean>(false);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`${backendUrl}/api/payments/prices`, {
          headers: createHeaders(accessToken),
        });
        
        // Check if response is ok and has content
        if (!res.ok) {
          if (res.status === 429) {
            const retryAfter = res.headers.get('Retry-After');
            console.warn(`⚠️ Rate limit exceeded (429) loading prices. ${retryAfter ? `Retry after ${retryAfter}s` : 'Please try again later.'}`);
          } else {
            console.warn('load prices: response not ok', res.status, res.statusText);
          }
          return;
        }
        
        // Check content type and if response has body
        const contentType = res.headers.get('content-type');
        const text = await res.text();
        
        // If empty response, skip parsing
        if (!text || text.trim().length === 0) {
          console.warn('load prices: empty response');
          return;
        }
        
        // Try to parse JSON
        let json;
        try {
          json = JSON.parse(text);
        } catch (parseError) {
          console.warn('load prices: JSON parse error', parseError, 'Response text:', text.substring(0, 100));
          return;
        }
        
        const allPrices = json.prices || json.data || [];
        
        // Filtrer pour ne garder que les prix récurrents (abonnements)
        // et qui sont actifs
        const subscriptionPrices = (allPrices as Price[]).filter((p) => {
          return p.type === 'recurring' && 
                 p.recurring !== null && 
                 p.active === true;
        });
        
        if (mounted) setPrices(subscriptionPrices);
        
        try {
          const customerId = await AsyncStorage.getItem('customerId');
          if (customerId) {
            const r2 = await fetch(`${backendUrl}/api/payments/customer/${customerId}`, {
              headers: createHeaders(accessToken),
            });
            if (r2.ok) {
              const responseText = await r2.text();
              if (responseText && responseText.trim().length > 0) {
                try {
                  const j2 = JSON.parse(responseText);
                  if (j2.activePriceId) setCurrentPriceId(j2.activePriceId);
                  else if (j2.activeSubscription && j2.activeSubscription.priceId) setCurrentPriceId(j2.activeSubscription.priceId);
                  if (j2.activeSubscription && j2.activeSubscription.id) setActiveSubscriptionId(j2.activeSubscription.id);
                  if (j2.activeSubscription && typeof j2.activeSubscription.cancelAtPeriodEnd === 'boolean') {
                    setCancelAtPeriodEnd(j2.activeSubscription.cancelAtPeriodEnd);
                  }
                  if (j2.activeSubscription && j2.activeSubscription.currentPeriodEnd) {
                    setCurrentPeriodEnd(j2.activeSubscription.currentPeriodEnd);
                  }
                } catch (parseError) {
                  console.warn('load customer subscription: JSON parse error', parseError);
                }
              }
            }
          }
        } catch (e) {
          // optional endpoint missing -> ignore
          console.warn('load customer subscription: error', e);
        }
      } catch (e) {
        console.warn('load prices', e);
      }
    }
    load();
    return () => { mounted = false; };
  }, [backendUrl, accessToken]);

  const subscribeTo = useCallback(async (priceId: string) => {
    setLoading(true);
    try {
      const customerId = await AsyncStorage.getItem('customerId');
      if (!customerId) throw new Error('Pas de customer');
      const res = await fetch(`${backendUrl}/api/payments/create-subscription`, {
        method: 'POST',
        headers: createHeaders(accessToken),
        body: JSON.stringify({ priceId, customerId })
      });
      
      // Check response and parse JSON safely
      const responseText = await res.text();
      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Réponse vide du serveur');
      }
      
      let json;
      try {
        json = JSON.parse(responseText);
      } catch (parseError) {
        console.error('subscribeTo: JSON parse error', parseError, 'Response:', responseText.substring(0, 200));
        throw new Error('Erreur de format de réponse du serveur');
      }
      
      if (!res.ok) throw new Error(json.message || 'Impossible de créer la subscription');

      // Si la souscription a été créée sans paiement (free plan), mettre à jour l'état tout de suite
      if (!json.clientSecret) {
        try {
          setCurrentPriceId(priceId);
          if (json.subscriptionId) setActiveSubscriptionId(json.subscriptionId);
          if (json.cancelAtPeriodEnd === true) setCancelAtPeriodEnd(true);
          if (json.currentPeriodEnd) setCurrentPeriodEnd(json.currentPeriodEnd);
        } catch (e) { /* ignore state set errors */ }
        return json;
      }

      // Si un clientSecret est retourné (paiement requis), tenter de vérifier l'état de la souscription
      // en interrogeant l'endpoint customer/<id> quelques fois après que le paiement soit confirmé.
      // Cela permet d'actualiser l'UI rapidement une fois la confirmation effectuée côté front.
      (async () => {
        const maxTries = 6; // ~12s
        const delayMs = 2000;
        for (let i = 0; i < maxTries; i++) {
          try {
            await new Promise((r) => setTimeout(r, delayMs));
            const r2 = await fetch(`${backendUrl}/api/payments/customer/${customerId}`, {
              headers: createHeaders(accessToken),
            });
            if (!r2.ok) continue;
            
            const responseText = await r2.text();
            if (!responseText || responseText.trim().length === 0) continue;
            
            try {
              const j2 = JSON.parse(responseText);
              // si backend rapporte activeSubscription, on met à jour l'état et on arrête
              if (j2.activeSubscription && j2.activeSubscription.id) {
                setCurrentPriceId(j2.activeSubscription.priceId || priceId);
                setActiveSubscriptionId(j2.activeSubscription.id);
                setCancelAtPeriodEnd(Boolean(j2.activeSubscription.cancelAtPeriodEnd));
                if (j2.activeSubscription.currentPeriodEnd) setCurrentPeriodEnd(j2.activeSubscription.currentPeriodEnd);
                break;
              }
            } catch (parseError) {
              // ignore JSON parse errors in retry loop
              console.warn('subscribeTo retry: JSON parse error', parseError);
            }
          } catch (e) {
            // ignore intermittent errors
          }
        }
      })();

      return json;
    } finally { setLoading(false); }
  }, [backendUrl, accessToken]);

  const cancelSubscription = useCallback(async (subId?: string) => {
    const id = subId || activeSubscriptionId;
    if (!id) throw new Error('Aucun abonnement actif');
    
    try {
      // Get customerId to try customer-based endpoint
      const customerId = await AsyncStorage.getItem('customerId');
      
      // Try different possible endpoints in order
      const endpoints = [
        // Most common patterns
        { url: `${backendUrl}/api/payments/subscription/cancel`, body: { subscriptionId: id, atPeriodEnd: true } },
        { url: `${backendUrl}/api/payments/subscriptions/${id}/cancel`, body: { atPeriodEnd: true } },
        { url: `${backendUrl}/api/payments/cancel-subscription`, body: { subscriptionId: id, atPeriodEnd: true } },
        // Customer-based endpoints
        ...(customerId ? [
          { url: `${backendUrl}/api/payments/customer/${customerId}/cancel-subscription`, body: { subscriptionId: id, atPeriodEnd: true } },
          { url: `${backendUrl}/api/payments/customer/${customerId}/subscription/cancel`, body: { subscriptionId: id, atPeriodEnd: true } },
        ] : []),
      ];
      
      let lastError: any = null;
      
      for (const { url, body } of endpoints) {
        try {
          console.log('Trying endpoint:', url, 'with body:', body);
          const res = await fetch(url, {
            method: 'POST',
            headers: createHeaders(accessToken),
            body: JSON.stringify(body)
          });
          
          const responseText = await res.text();
          
          // If 404, try next endpoint
          if (res.status === 404) {
            console.log('Endpoint not found:', url);
            lastError = new Error(`Endpoint non trouvé: ${url}`);
            continue;
          }
          
          // If empty response but OK, consider it success
          if (!responseText || responseText.trim().length === 0) {
            if (res.ok) {
              try {
                setCancelAtPeriodEnd(true);
                console.log('Successfully cancelled subscription using endpoint:', url);
                return { success: true };
              } catch (e) {
                console.warn('cancelSubscription: error updating state', e);
              }
            }
            lastError = new Error('Réponse vide du serveur');
            continue;
          }
          
          // Parse JSON response
          let json;
          try {
            json = JSON.parse(responseText);
          } catch (parseError) {
            console.error('cancelSubscription: JSON parse error', parseError, 'Response:', responseText.substring(0, 200));
            lastError = new Error('Erreur de format de réponse du serveur');
            continue;
          }
          
          if (!res.ok) {
            lastError = new Error(json.error || json.message || 'Impossible de résilier');
            continue;
          }
          
          // Success! Update state
          try {
            setCancelAtPeriodEnd(true);
            if (json.currentPeriodEnd) setCurrentPeriodEnd(json.currentPeriodEnd);
            if (json.activePriceId) setCurrentPriceId(json.activePriceId);
          } catch (e) { 
            console.warn('cancelSubscription: error updating state', e);
          }
          
          console.log('Successfully cancelled subscription using endpoint:', url);
          return json;
        } catch (fetchError: any) {
          console.warn(`Failed to cancel with endpoint ${url}:`, fetchError);
          lastError = fetchError;
          continue;
        }
      }
      
      // All endpoints failed
      throw lastError || new Error('Aucun endpoint valide trouvé pour annuler l\'abonnement. Veuillez vérifier la configuration du backend.');
    } catch (error: any) {
      console.error('cancelSubscription error:', error);
      throw error;
    }
  }, [backendUrl, activeSubscriptionId, accessToken]);

  return { prices, currentPriceId, activeSubscriptionId, loading, cancelAtPeriodEnd, currentPeriodEnd, subscribeTo, cancelSubscription } as const;
}

// useUserTransactions
export function useUserTransactions(backendUrl = BACKEND_URL, userId?: string, refetchKey = 0) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Tx[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (!userId) {
          if (mounted) {
            setTransactions(null);
            setLoading(false);
          }
          return;
        }
        const res = await fetch(`${backendUrl}/payouts?userId=${encodeURIComponent(String(userId))}`);
        const json = await res.json();
        if (mounted) {
          setTransactions(json.payouts || []);
        }
      } catch (e) {
        console.warn('useUserTransactions', e);
        if (mounted) {
          setError((e as any)?.message || 'Erreur lors du chargement');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [backendUrl, userId, refetchKey]);

  return { loading, transactions, error } as const;
}

// useRegister
export function useRegister(backendUrl = BACKEND_URL) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const createCustomer = useCallback(async () => {
    if (!email) throw new Error('Email requis');
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/create-customer`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
      });
      const json = await res.json();
      if (res.ok && json.customerId) {
        await AsyncStorage.setItem('customerId', json.customerId);
        return json.customerId;
      }
      throw new Error(json.message || 'Impossible de créer le customer');
    } finally { setLoading(false); }
  }, [backendUrl, email]);

  return { email, setEmail, loading, createCustomer } as const;
}

// useSubscribe
export function useSubscribe(clientSecret?: string, onSuccess?: () => void, onError?: (error: any) => void) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  useEffect(() => {
    let cancelled = false;
    if (!clientSecret) return;
    async function initAndPresent() {
      try {
        const { error } = await initPaymentSheet({ paymentIntentClientSecret: clientSecret, merchantDisplayName: 'Demo Stripe App' } as any);
        if (error) {
          console.warn('initPaymentSheet error', error);
          if (!cancelled) {
            onError?.(error);
          }
          return;
        }
        if (!cancelled) {
          const { error: presentError } = await presentPaymentSheet();
          if (presentError) {
            console.warn('presentPaymentSheet', presentError);
            // Call onError for cancellation or other errors
            onError?.(presentError);
          } else {
            onSuccess?.();
          }
        }
      } catch (e) {
        console.warn('init/present failed', e);
        if (!cancelled) {
          onError?.(e);
        }
      }
    }
    initAndPresent();
    return () => { cancelled = true; };
  }, [clientSecret, initPaymentSheet, presentPaymentSheet, onSuccess, onError]);

  const openSheet = async () => {
    if (!clientSecret) {
      onSuccess?.();
      return;
    }
    const { error } = await presentPaymentSheet();
    if (error) {
      onError?.(error);
      throw error;
    }
    onSuccess?.();
  };

  return { openSheet } as const;
}

// useUserSubscription - Check if a user has an active subscription
export function useUserSubscription(customerId?: string | null, backendUrl = BACKEND_URL, accessToken?: string | null) {
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!customerId) {
        setHasActiveSubscription(false);
        setSubscriptionData(null);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`${backendUrl}/api/payments/customer/${customerId}`, {
          headers: createHeaders(accessToken),
        });
        
        if (res.ok) {
          const responseText = await res.text();
          if (responseText && responseText.trim().length > 0) {
            try {
              const json = JSON.parse(responseText);
              const hasActive = json.activeSubscription && 
                               json.activeSubscription.status === 'active' && 
                               !json.activeSubscription.cancelAtPeriodEnd;
              if (mounted) {
                setHasActiveSubscription(hasActive);
                setSubscriptionData(json.activeSubscription || null);
              }
            } catch (parseError) {
              console.warn('useUserSubscription: JSON parse error', parseError);
              if (mounted) {
                setHasActiveSubscription(false);
                setSubscriptionData(null);
              }
            }
          }
        } else {
          if (mounted) {
            setHasActiveSubscription(false);
            setSubscriptionData(null);
          }
        }
      } catch (e) {
        console.warn('useUserSubscription: error', e);
        if (mounted) {
          setHasActiveSubscription(false);
          setSubscriptionData(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [customerId, backendUrl, accessToken]);

  return { hasActiveSubscription, loading, subscriptionData } as const;
}

