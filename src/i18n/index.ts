import { appConfig } from '@/config/app';
import { en } from './messages/en';
import { fr } from './messages/fr';

const dictionaries = {
  en,
  fr
} as const;

export type Locale = string;

export const defaultLocale = appConfig.defaultLocale;
export const supportedLocales = appConfig.supportedLocales;

export const isSupportedLocale = (locale: string): locale is Locale =>
  supportedLocales.includes(locale);

export const getDictionary = (locale: string) => {
  const dictionary = dictionaries[locale as keyof typeof dictionaries];
  if (dictionary) return dictionary;

  const fallback = dictionaries[defaultLocale as keyof typeof dictionaries];
  return fallback ?? en;
};
