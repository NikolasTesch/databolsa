import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { verifyAccessToken } from '@/lib/auth/jwt';

export default async function PublicLayout({ children }: { children: ReactNode }) {
  let isAuthenticated = false;

  try {
    const cookieStore = cookies();
    const token = cookieStore.get('access_token')?.value;
    if (token) {
      const payload = await verifyAccessToken(token);
      isAuthenticated = payload !== null;
    }
  } catch {
    isAuthenticated = false;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PublicHeader isAuthenticated={isAuthenticated} />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
