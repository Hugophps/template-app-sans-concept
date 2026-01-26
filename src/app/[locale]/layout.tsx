import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { Header } from '@/components/header';
import { getDictionary, isSupportedLocale } from '@/i18n';

export default function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  if (!isSupportedLocale(params.locale)) {
    notFound();
  }

  const dictionary = getDictionary(params.locale);

  return (
    <div className="app-shell">
      <Header locale={params.locale} labels={dictionary.nav} />
      <main>{children}</main>
    </div>
  );
}
