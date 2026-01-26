import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { appConfig } from '@/config/app';

export const legalSlugs = ['privacy', 'terms', 'imprint', 'cookies'] as const;
export type LegalSlug = (typeof legalSlugs)[number];

const resolveDocPath = (locale: string, slug: LegalSlug) =>
  join(process.cwd(), 'content', 'legal', locale, `${slug}.md`);

export const loadLegalDoc = (locale: string, slug: LegalSlug) => {
  const directPath = resolveDocPath(locale, slug);
  if (existsSync(directPath)) {
    return { content: readFileSync(directPath, 'utf-8'), locale };
  }

  const fallbackPath = resolveDocPath(appConfig.defaultLocale, slug);
  if (existsSync(fallbackPath)) {
    return { content: readFileSync(fallbackPath, 'utf-8'), locale: appConfig.defaultLocale };
  }

  return null;
};
