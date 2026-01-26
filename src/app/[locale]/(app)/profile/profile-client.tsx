'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/supabase/client';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Select } from '@/ui/select';

export type ProfileCopy = {
  emailLabel: string;
  changeEmailTitle: string;
  newEmailLabel: string;
  updateEmail: string;
  languageLabel: string;
  signOut: string;
  updateSuccess: string;
  updateError: string;
};

export const ProfileClient = ({
  userId,
  email,
  locale,
  currentLocale,
  supportedLocales,
  copy
}: {
  userId: string;
  email: string;
  locale: string;
  currentLocale: string;
  supportedLocales: string[];
  copy: ProfileCopy;
}) => {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [newEmail, setNewEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error' | 'success'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedLocale, setSelectedLocale] = useState(currentLocale);

  const handleEmailUpdate = async () => {
    if (!newEmail) return;
    setStatus('saving');
    setStatusMessage('');

    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      setStatus('error');
      setStatusMessage(error.message);
      return;
    }

    setStatus('success');
    setStatusMessage(copy.updateSuccess);
  };

  const handleLocaleChange = async (nextLocale: string) => {
    setSelectedLocale(nextLocale);
    setStatus('saving');
    setStatusMessage('');

    const { error } = await supabase
      .from('profiles')
      .update({ locale: nextLocale })
      .eq('id', userId);

    if (error) {
      setStatus('error');
      setStatusMessage(copy.updateError);
      return;
    }

    setStatus('success');
    setStatusMessage(copy.updateSuccess);
    router.push(`/${nextLocale}/profile`);
    router.refresh();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
    router.refresh();
  };

  return (
    <div className="inline-stack">
      <div className="ui-card inline-stack">
        <div>
          <strong>{copy.emailLabel}</strong>
          <p>{email}</p>
        </div>
        <div className="inline-stack">
          <h2>{copy.changeEmailTitle}</h2>
          <Input
            type="email"
            name="new-email"
            label={copy.newEmailLabel}
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
          />
          <Button onClick={handleEmailUpdate} disabled={!newEmail || status === 'saving'}>
            {copy.updateEmail}
          </Button>
        </div>
        <div className="inline-stack">
          <Select
            label={copy.languageLabel}
            value={selectedLocale}
            onChange={(event) => handleLocaleChange(event.target.value)}
            options={supportedLocales.map((value) => ({
              value,
              label: value.toUpperCase()
            }))}
          />
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          {copy.signOut}
        </Button>
      </div>
      {status !== 'idle' ? (
        <div className={`notice${status === 'error' ? ' notice--error' : ''}`}>
          {status === 'error' && statusMessage ? statusMessage : copy.updateSuccess}
        </div>
      ) : null}
    </div>
  );
};
