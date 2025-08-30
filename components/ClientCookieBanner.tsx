'use client';

import dynamic from 'next/dynamic';

// Si tu CookieBanner es export NOMBRE (no default):
const CookieBanner = dynamic(
  () => import('@/components/cookies/CookieBanner').then(m => m.CookieBanner),
  { ssr: false }
);

export function ClientCookieBanner() {
  return <CookieBanner />;
}
