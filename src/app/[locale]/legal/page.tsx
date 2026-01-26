import Link from 'next/link';
import { getDictionary } from '@/i18n';
import { legalSlugs } from '@/lib/legal';

const getVisibleSlugs = () => {
  const mode = process.env.NEXT_PUBLIC_LEGAL_MODE ?? 'web';
  return legalSlugs.filter((slug) => (slug === 'cookies' ? mode === 'web' : true));
};

export default function LegalIndex({ params }: { params: { locale: string } }) {
  const dictionary = getDictionary(params.locale);
  const visibleSlugs = getVisibleSlugs();

  const labels: Record<string, string> = {
    privacy: dictionary.legal.privacy,
    terms: dictionary.legal.terms,
    imprint: dictionary.legal.imprint,
    cookies: dictionary.legal.cookies
  };

  return (
    <div className="page">
      <h1 className="page__title">{dictionary.legal.title}</h1>
      <div className="ui-card inline-stack">
        {visibleSlugs.map((slug) => (
          <Link key={slug} href={`/${params.locale}/legal/${slug}`}>
            {labels[slug]}
          </Link>
        ))}
      </div>
    </div>
  );
}
