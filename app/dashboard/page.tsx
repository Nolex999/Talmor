import { redirect } from 'next/navigation';

/** Legacy /dashboard → account (no key dashboard). */
export default function DashboardRedirect() {
  redirect('/account');
}
