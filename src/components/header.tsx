import Link from 'next/link';
import { Logo } from './logo';

type HeaderLabels = {
  profile: string;
  legal: string;
};

export const Header = ({ locale, labels }: { locale: string; labels: HeaderLabels }) => (
  <header className="app-header">
    <div className="app-header__brand">
      <Logo />
    </div>
    <nav className="app-header__nav">
      <Link href={`/${locale}/profile`}>{labels.profile}</Link>
      <Link href={`/${locale}/legal`}>{labels.legal}</Link>
    </nav>
  </header>
);
