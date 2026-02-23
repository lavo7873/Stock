import { redirect } from 'next/navigation';
import { hasAuth } from '@/lib/simpleAuth';

export default async function HomePage() {
  if (await hasAuth()) redirect('/dashboard');
  redirect('/login');
}
