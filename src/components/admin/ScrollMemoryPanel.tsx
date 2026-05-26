'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export function ScrollMemoryPanel({
  children,
  className,
  storageKey,
}: {
  children: ReactNode;
  className: string;
  storageKey: string;
}) {
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return undefined;

    const savedScrollTop = window.sessionStorage.getItem(storageKey);
    if (savedScrollTop) panel.scrollTop = Number(savedScrollTop);

    const saveScrollTop = () => {
      window.sessionStorage.setItem(storageKey, String(panel.scrollTop));
    };

    panel.addEventListener('scroll', saveScrollTop, { passive: true });
    return () => panel.removeEventListener('scroll', saveScrollTop);
  }, [storageKey]);

  return (
    <aside className={className} ref={panelRef}>
      {children}
    </aside>
  );
}
