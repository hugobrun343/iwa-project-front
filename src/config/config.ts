/**
 * Configuration constants for Stripe hooks
 */

import { DEFAULT_BASE_URL } from '../services/apiClient';

// Re-export backend URL for convenience
export const BACKEND_URL = DEFAULT_BASE_URL;

// Demo IDs for testing
export const DEMO_IDS = {
  GUARDIAN_USER_ID: 'demo_guardian_123', // Replace with actual demo ID if needed
};

// Premium subscription price ID from Stripe
export const PREMIUM_PRICE_ID = process.env.EXPO_PUBLIC_PREMIUM_PRICE_ID || 'price_premium_monthly';

