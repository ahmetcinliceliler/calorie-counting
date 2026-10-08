import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import tr from './tr.json';

export const resources = { tr: { translation: tr } } as const;
export const supportedLanguages = Object.keys(resources);

const deviceLanguage = getLocales()[0]?.languageCode ?? 'tr';

const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources,
  lng: supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'tr',
  fallbackLng: 'tr',
  interpolation: { escapeValue: false },
});

export default i18n;
