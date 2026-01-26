'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/supabase/client';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';

export type AuthCopy = {
  title: string;
  subtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  sendLink: string;
  resendLink: string;
  checkEmailTitle: string;
  checkEmailBody: string;
  supportLine: string;
  errorTitle: string;
  successTitle: string;
};

type Status = 'idle' | 'sending' | 'sent' | 'error';

export const LoginForm = ({
  locale,
  copy,
  supportEmail
}: {
  locale: string;
  copy: AuthCopy;
  supportEmail: string;
}) => {
  const [email, setEmail] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const sendLink = async () => {
    setStatus('sending');
    setError(null);

    try {
      const normalizedEmail = email.trim();
      if (!normalizedEmail) {
        setStatus('idle');
        return;
      }
      const redirectTarget = `${window.location.origin}/auth/callback?next=/${locale}/profile`;
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: redirectTarget
        }
      });

      if (signInError) {
        setStatus('error');
        setError(signInError.message);
        return;
      }

      setSentEmail(normalizedEmail);
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unexpected error');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    await sendLink();
  };

  const authError = searchParams.get('error');

  return (
    <div className="inline-stack">
      {authError ? (
        <div className="notice notice--error">{copy.errorTitle}</div>
      ) : null}

      {status === 'sent' ? (
        <div className="inline-stack">
          <div className="notice">
            <strong>{copy.successTitle}</strong>
          </div>
          <div className="ui-card">
            <h2>{copy.checkEmailTitle}</h2>
            <p>
              {copy.checkEmailBody} <strong>{sentEmail}</strong>.
            </p>
            <Button
              variant="secondary"
              size="md"
              onClick={sendLink}
              disabled={status === 'sending'}
            >
              {copy.resendLink}
            </Button>
          </div>
          <p>
            {copy.supportLine} <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
          </p>
        </div>
      ) : (
        <form className="inline-stack" onSubmit={handleSubmit}>
          <Input
            type="email"
            name="email"
            label={copy.emailLabel}
            placeholder={copy.emailPlaceholder}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          {status === 'error' && error ? (
            <div className="notice notice--error">{error}</div>
          ) : null}
          <Button size="lg" type="submit" disabled={!email || status === 'sending'}>
            {copy.sendLink}
          </Button>
        </form>
      )}
    </div>
  );
};
