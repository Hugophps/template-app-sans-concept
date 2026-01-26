import { appConfig } from '@/config/app';
import { getDictionary } from '@/i18n';
import { LoginForm } from './login-form';

export default function LoginPage({ params }: { params: { locale: string } }) {
  const dictionary = getDictionary(params.locale);

  return (
    <div className="page">
      <section className="panel panel--narrow">
        <div className="auth-hero">
          <h1>{dictionary.auth.title}</h1>
          <p>{dictionary.auth.subtitle}</p>
        </div>
        <LoginForm
          locale={params.locale}
          copy={dictionary.auth}
          supportEmail={appConfig.supportEmail}
        />
      </section>
    </div>
  );
}
