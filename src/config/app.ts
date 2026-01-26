import appConfigJson from './app.json';

export type AppConfig = {
  appName: string;
  publicAppName: string;
  supportEmail: string;
  logoUrl: string;
  primaryColor: string;
  defaultLocale: string;
  supportedLocales: string[];
};

const normalizedLocales = Array.from(
  new Set([
    appConfigJson.defaultLocale,
    ...appConfigJson.supportedLocales
  ].filter((value): value is string => typeof value === 'string' && value.length > 0))
);

export const appConfig: AppConfig = {
  appName: appConfigJson.appName,
  publicAppName: appConfigJson.publicAppName,
  supportEmail: appConfigJson.supportEmail,
  logoUrl: appConfigJson.logoUrl,
  primaryColor: appConfigJson.primaryColor,
  defaultLocale: appConfigJson.defaultLocale,
  supportedLocales: normalizedLocales
};
