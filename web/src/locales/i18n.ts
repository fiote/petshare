import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './en/common.json';
import enAuth from './en/auth.json';
import enPets from './en/pets.json';
import enProfile from './en/profile.json';
import ptBRCommon from './pt-BR/common.json';
import ptBRAuth from './pt-BR/auth.json';
import ptBRPets from './pt-BR/pets.json';
import ptBRProfile from './pt-BR/profile.json';

export const LANGUAGE_STORAGE_KEY = 'petshare_lang';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, auth: enAuth, pets: enPets, profile: enProfile },
      'pt-BR': { common: ptBRCommon, auth: ptBRAuth, pets: ptBRPets, profile: ptBRProfile },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'pt-BR'],
    ns: ['common', 'auth', 'pets', 'profile'],
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

export function toIntlLocale(i18nLang: string): string {
  return i18nLang === 'pt-BR' ? 'pt-BR' : 'en-US';
}

export default i18n;
