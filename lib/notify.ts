// lib/notify.ts
'use client';

import { auth } from '@/lib/firebase';

type Changes = {
  status?: 'pendiente' | 'revisada' | 'aprobada' | 'suspendida' | string;
  grade?: number | null;
  comment?: string | null;
};

export async function notifyEntrega(entregaId: string, changes: Changes = {}) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  const devSecret = (process.env.NEXT_PUBLIC_DEV_ADMIN_SECRET || '').trim();
  if (devSecret) headers['x-dev-admin-secret'] = devSecret;

  const token = await auth.currentUser?.getIdToken?.();
  if (token) headers['authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/notify-entrega', {
    method: 'POST',
    headers,
    body: JSON.stringify({ entregaId, changes }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Fallo al notificar entrega');
  }
  return res.json();
}
