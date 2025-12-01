import i18n, { InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';

// Locales
import enCommon from './locales/en/common.json';
import frCommon from './locales/fr/common.json';

// Configure resources
const resources = {
  en: {
    common: enCommon,
  },
  fr: {
    common: frCommon,
  },
};

// Initialize i18next
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: 'en',
      fallbackLng: 'en',
      ns: ['common'],
      defaultNS: 'common',
      interpolation: {
        escapeValue: false,
      },
      compatibilityJSON: 'v4',
      react: {
        useSuspense: false,
      },
    } as InitOptions);
}

export default i18n;

