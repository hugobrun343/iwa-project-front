import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';

/**
 * StripeProviderWrapper
 * ---------------------
 * Minimal wrapper that fetches the Stripe publishable key from the backend
 * and initializes `StripeProvider` for children components.
 *
 * Props:
 * - configUrl: base URL to call GET /config which must return { publishableKey }
 * - children: React element(s) that require StripeProvider
 *
 * Behavior:
 * - shows a loading indicator while fetching key
 * - shows a short error message if no key is returned
 */

import { DEFAULT_BASE_URL } from '../services/apiClient';

type Props = {
  children: React.ReactElement | React.ReactElement[];
  /** full URL to backend that exposes /config -> { publishableKey } */
  configUrl?: string;
};

export default function StripeProviderWrapper({ children, configUrl = DEFAULT_BASE_URL }: Props) {
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadKey() {
      try {
        const res = await fetch(`${configUrl}/api/payments/config`);
        const json = await res.json();
        if (mounted) {
          if (json.publishableKey) setPublishableKey(json.publishableKey);
          else console.warn('No publishableKey returned from /config');
        }
      } catch (e: any) {
        const msg = e && e.message ? e.message : String(e);
        console.warn('Failed to fetch publishable key from', configUrl, e);
        setErrorMessage(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadKey();
    return () => {
      mounted = false;
    };
  }, [configUrl]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Chargement Stripe...</Text>
      </View>
    );
  }

  if (!publishableKey) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <Text>Impossible d'initialiser Stripe: publishableKey introuvable.</Text>
        <Text style={{ marginTop: 8 }}>Vérifiez que votre backend expose GET {configUrl}/api/payments/config</Text>
        {errorMessage ? (
          <Text style={{ marginTop: 8, color: 'red' }}>Erreur réseau: {errorMessage}</Text>
        ) : null}
      </View>
    );
  }

  return <StripeProvider publishableKey={publishableKey}>{children}</StripeProvider>;
}
