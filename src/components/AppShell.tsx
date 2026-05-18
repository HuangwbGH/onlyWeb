'use client';

import { usePathname } from 'next/navigation';
import { SiteFooter, SiteHeader } from '@/components/Layout';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSharedResume = pathname.startsWith('/r/');

  if (isSharedResume) return <>{children}</>;

  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
