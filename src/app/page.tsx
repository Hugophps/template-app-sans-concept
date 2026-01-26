import { redirect } from 'next/navigation';
import { appConfig } from '@/config/app';

export default function Home() {
  redirect(`/${appConfig.defaultLocale}`);
}
