import Link from 'next/link';
import { appConfig } from '@/config/app';

export default function NotFound() {
  return (
    <div className="page">
      <div className="panel panel--narrow">
        <h1 className="page__title">Page not found</h1>
        <p>The page you are looking for does not exist.</p>
        <Link className="ui-button ui-button--primary ui-button--md" href={`/${appConfig.defaultLocale}`}>
          Go back home
        </Link>
      </div>
    </div>
  );
}
