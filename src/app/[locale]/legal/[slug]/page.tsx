import { notFound } from 'next/navigation';
import { legalSlugs, loadLegalDoc, type LegalSlug } from '@/lib/legal';
import { renderMarkdown } from '@/lib/markdown';

export default function LegalPage({
  params
}: {
  params: { locale: string; slug: string };
}) {
  if (!legalSlugs.includes(params.slug as LegalSlug)) {
    notFound();
  }

  const doc = loadLegalDoc(params.locale, params.slug as LegalSlug);
  if (!doc) {
    notFound();
  }

  return (
    <div className="page">
      <section className="panel panel--narrow">{renderMarkdown(doc.content)}</section>
    </div>
  );
}
