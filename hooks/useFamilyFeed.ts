'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection, query, where, orderBy, limit, getDocs, Timestamp,
} from 'firebase/firestore';
import { useAuthUser } from './useAuthUser';

type Target =
  | { scope: 'all' }
  | { scope: 'family'; familyId: string }
  | { scope: 'student'; studentId: string };

type AvisoFS = {
  id?: string;                  // lo añadimos al map
  type: 'aviso' | 'tarea';
  title: string;
  content?: string;
  createdAt: number | Timestamp;
  dueDate?: number | Timestamp | null;
  subjectId?: string;
  target: Target;
  createdBy: string;
};

// normaliza number/Timestamp -> millis
const toMillis = (v: number | Timestamp | undefined | null) =>
  typeof v === 'number' ? v : v instanceof Timestamp ? v.toMillis() : 0;

export function useFamilyFeed(max = 20) {
  const { userDoc } = useAuthUser();
  const [items, setItems] = useState<(AvisoFS & { id: string; createdAtMs: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!userDoc?.familyId) return;
      setLoading(true);

      const qAll = query(
        collection(db, 'avisos'),
        where('target.scope', '==', 'all'),
        orderBy('createdAt', 'desc'),
        limit(max)
      );

      const qFamily = query(
        collection(db, 'avisos'),
        where('target.scope', '==', 'family'),
        where('target.familyId', '==', userDoc.familyId),
        orderBy('createdAt', 'desc'),
        limit(max)
      );

      // hijos de la familia
      const studentsSnap = await getDocs(
        query(collection(db, 'students'), where('familyId', '==', userDoc.familyId))
      );
      const studentIds = studentsSnap.docs.map((d) => d.id);

      const [allSnap, famSnap, ...stuSnaps] = await Promise.all([
        getDocs(qAll),
        getDocs(qFamily),
        ...studentIds.map((sid) =>
          getDocs(
            query(
              collection(db, 'avisos'),
              where('target.scope', '==', 'student'),
              where('target.studentId', '==', sid),
              orderBy('createdAt', 'desc'),
              limit(max)
            )
          )
        ),
      ]);

      const mapDocs = (docs: typeof allSnap.docs) =>
        docs.map((d) => {
          const data = d.data() as AvisoFS;
          return {
            id: d.id,
            ...data,
            createdAtMs: toMillis(data.createdAt),
          };
        });

      const merged = [
        ...mapDocs(allSnap.docs),
        ...mapDocs(famSnap.docs),
        ...stuSnaps.flatMap((s) => mapDocs(s.docs)),
      ]
        .sort((a, b) => b.createdAtMs - a.createdAtMs)
        .slice(0, max);

      setItems(merged);
      setLoading(false);
    })();
  }, [userDoc?.familyId, max]);

  return { items, loading };
}
