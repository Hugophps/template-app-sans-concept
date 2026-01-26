import { redirect } from 'next/navigation';
import { appConfig } from '@/config/app';
import { getDictionary, supportedLocales } from '@/i18n';
import { fetchProfile, type Profile } from '@/services/supabase';
import { createServerSupabaseClient } from '@/supabase/server';
import { ProfileClient } from './profile-client';

export default async function ProfilePage({ params }: { params: { locale: string } }) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect(`/${params.locale}/login`);
  }

  let profile: Profile | null = null;
  try {
    profile = await fetchProfile(data.user.id);
  } catch {
    profile = null;
  }
  const activeLocale = profile?.locale ?? appConfig.defaultLocale;
  const dictionary = getDictionary(params.locale);

  return (
    <div className="page">
      <h1 className="page__title">{dictionary.profile.title}</h1>
      <ProfileClient
        userId={data.user.id}
        email={data.user.email ?? ''}
        locale={params.locale}
        currentLocale={supportedLocales.includes(activeLocale) ? activeLocale : appConfig.defaultLocale}
        supportedLocales={supportedLocales}
        copy={dictionary.profile}
      />
    </div>
  );
}
