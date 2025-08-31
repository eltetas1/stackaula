'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { useAuthUser } from '@/hooks/useAuthUser';

export type AvisoFS = {
  title: string;
  body?: string;
  type?: 'aviso' | 'tarea';
  createdAt?: any; // Firestore Timestamp
  visible?: boolean;
  published?: boolean;
};

/**
 * Feed para familias (o público). Lee /avisos ordenados por fecha.
 * No depende de userDoc; usa únicamente { user, loading }.
 */
export function useFamilyFeed(max = 20) {
  const { user, loading } = useAuthUser();
  const [items, setItems] = useState<
    (AvisoFS & { id: string; createdAtMs: number })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    const fetch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Avisos son de lectura pública según tus reglas
        // Ordenamos por createdAt descendente y limitamos
        const q = query(
          collection(db, 'avisos'),
          orderBy('createdAt', 'desc'),
          limit(max)
        );

        const snap = await getDocs(q);
        const rows = snap.docs.map((d) => {
          const data = d.data() as AvisoFS;
          const createdAtMs =
            (data.createdAt && typeof data.createdAt.toMillis === 'function'
              ? data.createdAt.toMillis()
              : 0) ?? 0;
          return { id: d.id, createdAtMs, ...data };
        });

        setItems(rows);
      } catch (e: any) {
        console.error('useFamilyFeed error:', e);
        setError('No se pudo cargar el feed.');
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, [loading, user, max]);

  return { items, loading: isLoading, error };
}

export default useFamilyFeed;
