// src/hooks/useEntregas.ts
'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit as qlimit,
  Timestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type Entrega = {
  id: string;
  tareaId?: string | null;
  studentId?: string | null;
  familyId?: string | null;
  linkUrl?: string | null;
  status?: 'enviada' | 'revisada' | 'aprobada' | 'rechazada' | string | null;
  createdAt?: Date | null;
  // cualquier campo extra que quieras visualizar
  [k: string]: any;
};

export function useEntregas(opts?: { limit?: number }) {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const baseCol = collection(db, 'entregas'); // 👈 nombre de colección según tus reglas
    const q = opts?.limit
      ? query(baseCol, orderBy('createdAt', 'desc'), qlimit(opts.limit))
      : query(baseCol, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: Entrega[] = snap.docs.map((d) => {
          const data = d.data();
          let createdAt: Date | null = null;
          const raw = data?.createdAt;
          if (raw instanceof Timestamp) createdAt = raw.toDate();
          else if (typeof raw === 'number') createdAt = new Date(raw);
          else createdAt = raw ?? null;

          return {
            id: d.id,
            tareaId: data?.tareaId ?? null,
            studentId: data?.studentId ?? null,
            familyId: data?.familyId ?? null,
            linkUrl: data?.linkUrl ?? null,
            status: data?.status ?? 'enviada',
            createdAt,
            ...data,
          };
        });
        setEntregas(rows);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [opts?.limit]);

  const marcarComo = async (id: string, status: Entrega['status']) => {
    const ref = doc(db, 'entregas', id);
    await updateDoc(ref, { status });
  };

  return { entregas, loading, marcarComo };
}
