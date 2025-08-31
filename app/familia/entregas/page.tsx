// app/familia/entregas/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { useUserRole } from '@/hooks/useUserRole';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Entrega = {
  id: string;
  tareaId?: string;
  alumnoNombre?: string;
  alumnoApellidos?: string;
  createdAt?: any;
  status?: 'pendiente' | 'revisada' | 'aprobada' | 'rechazada';
  comentarioDocente?: string;
  nota?: number | null;
  linkURL?: string;
  linkUrl?: string;
};

const statusLabel = {
  pendiente: 'Pendiente',
  revisada: 'Revisada',
  aprobada: 'Aprobada',
  rechazada: 'Suspendida',
} as const;

export default function FamiliaEntregasPage() {
  const { user, role, loading } = useUserRole();
  const isFamily = role === 'family';

  const [familyId, setFamilyId] = useState<string | null>(null);
  const [items, setItems] = useState<Entrega[]>([]);
  const [tasksById, setTasksById] = useState<Record<string, { title?: string }>>({});
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    if (loading || !user || !isFamily) return;
    (async () => {
      const uref = doc(db, 'users', user.uid);
      const usnap = await getDoc(uref);
      const fid = (usnap.exists() ? (usnap.data() as any)?.familyId : null) || null;
      setFamilyId(fid);
    })();
  }, [loading, user, isFamily]);

  useEffect(() => {
    if (!familyId) return;
    setLoadingList(true);
    const q = query(
      collection(db, 'entregas'),
      where('familyId', '==', familyId),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, async (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Entrega[];

      // lookup títulos tareas
      const ids = Array.from(new Set(rows.map((r) => r.tareaId).filter(Boolean) as string[]))
        .filter((id) => !tasksById[id]);
      if (ids.length) {
        const entries: Record<string, { title?: string }> = {};
        await Promise.all(ids.map(async (id) => {
          try {
            const s = await getDoc(doc(db, 'tareas', id));
            entries[id] = { title: s.exists() ? (s.data() as any)?.title : undefined };
          } catch {
            entries[id] = { title: undefined };
          }
        }));
        setTasksById((prev) => ({ ...prev, ...entries }));
      }

      setItems(rows);
      setLoadingList(false);
    });

    return () => unsub();
  }, [familyId, tasksById]);

  if (loading) return <main className="p-6">Cargando…</main>;
  if (!user || !isFamily) {
    return (
      <main className="container mx-auto p-6 space-y-3">
        <h1 className="text-xl font-semibold">Entregas</h1>
        <p className="text-muted-foreground">Debes acceder como familia.</p>
        <Button asChild variant="outline"><Link href="/">Volver</Link></Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis entregas</h1>
        <Button asChild variant="outline"><Link href="/">Inicio</Link></Button>
      </div>

      {loadingList ? (
        <p>Cargando entregas…</p>
      ) : items.length === 0 ? (
        <p>No tienes entregas todavía.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((e) => {
            const link = e.linkURL || e.linkUrl || '';
            const titulo = e.tareaId ? (tasksById[e.tareaId]?.title ?? e.tareaId) : '—';
            return (
              <Card key={e.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between gap-3">
                    <span>
                      {e.alumnoNombre ?? 'Alumno'} {e.alumnoApellidos ?? ''}{' '}
                      <span className="text-muted-foreground font-normal">— {titulo}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{statusLabel[(e.status || 'pendiente') as keyof typeof statusLabel]}</Badge>
                      <span className="text-sm font-semibold">Nota: {e.nota != null ? e.nota : '—'}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {link ? (
                    <a href={link} className="text-blue-600 underline" target="_blank" rel="noreferrer">Ver entrega</a>
                  ) : (
                    <span className="text-muted-foreground">Sin archivo/enlace</span>
                  )}
                  {e.comentarioDocente ? (
                    <div className="rounded border p-3 text-sm">
                      <b>Comentario del docente:</b>
                      <p className="mt-1 whitespace-pre-wrap">{e.comentarioDocente}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
