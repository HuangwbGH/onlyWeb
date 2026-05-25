'use client';

import { usePathname } from 'next/navigation';
import { SiteFooter, SiteHeader } from '@/components/Layout';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSharedResume = pathname.startsWith('/r/');
  const isStandalonePortfolio = pathname === '/portfolio' || pathname.startsWith('/portfolio/');

  if (isSharedResume || isStandalonePortfolio) return <>{children}</>;

  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
