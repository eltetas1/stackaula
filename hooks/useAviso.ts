'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  limit as qLimit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

type Options = { type?: 'all' | 'aviso' | 'tarea'; limit?: number };

export function useAvisos({ type = 'all', limit = 12 }: Options = {}) {
  const [avisos, setAvisos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);

  // IMPORTANT: tipa el lastDoc como QueryDocumentSnapshot<DocumentData>
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  const buildQuery = useCallback(() => {
    const col = collection(db, 'avisos');
    const byDate = orderBy('createdAt', 'desc');

    let q: any =
      type === 'all'
        ? query(col, byDate, qLimit(limit))
        : query(col, where('type', '==', type), byDate, qLimit(limit));

    if (lastDocRef.current) {
      q =
        type === 'all'
          ? query(col, byDate, startAfter(lastDocRef.current), qLimit(limit))
          : query(
              col,
              where('type', '==', type),
              byDate,
              startAfter(lastDocRef.current),
              qLimit(limit),
            );
    }
    return q;
  }, [type, limit]);

  const fetchPage = useCallback(
    async (reset = false) => {
      try {
        if (reset) {
          lastDocRef.current = null;
          setAvisos([]);
        }
        setLoading(true);
        setError(null);

        const q = buildQuery();
        const snap = await getDocs(q);

        if (!snap.empty) {
          // snap.docs ya es QueryDocumentSnapshot<DocumentData>[]
          lastDocRef.current = snap.docs[snap.docs.length - 1] as QueryDocumentSnapshot<DocumentData>;
        }

        // d.data() es unknown -> castea a DocumentData antes de spread
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as DocumentData) }));

        setAvisos((prev) => (reset ? rows : [...prev, ...rows]));
        setHasNext(snap.size === limit);
      } catch (e: any) {
        setError(e?.message ?? 'Error cargando avisos');
      } finally {
        setLoading(false);
      }
    },
    [buildQuery, limit],
  );

  useEffect(() => {
    fetchPage(true);
  }, [type, limit, fetchPage]);

  const loadMore = useCallback(() => fetchPage(false), [fetchPage]);
  const refresh = useCallback(() => fetchPage(true), [fetchPage]);

  return { avisos, loading, error, hasNext, loadMore, refresh };
}
