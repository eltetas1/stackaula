// app/maestro/entregas/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuthUser } from '@/hooks/useAuthUser';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Entrega = {
  id: string;
  tareaId: string;
  alumnoNombre: string;
  alumnoApellidos: string;
  linkURL?: string; // soportamos ambas
  linkUrl?: string; // soportamos ambas
  createdAt?: any;  // Timestamp | Date | number
  status?: 'pendiente' | 'revisada' | 'aprobada' | 'rechazada';
  familyId?: string;
  uid?: string;
  source?: 'public' | 'auth';
  [k: string]: any;
};

export default function MaestroEntregasPage() {
  const { user, loading } = useAuthUser();

  // ✅ evita TS2367: casteamos a string para comparar libremente
  const roleStr = useMemo(() => String(user?.role ?? ''), [user]);
  const isTeacher = roleStr === 'teacher' || roleStr === 'admin';

  const [items, setItems] = useState<Entrega[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | Entrega['status']>('todas');

  useEffect(() => {
    if (loading) return;
    if (!isTeacher) return;

    setLoadingList(true);
    const q = query(collection(db, 'entregas'), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => {
          const data = d.data() as any;

          // Normaliza createdAt -> Date si es posible
          let createdAt = data?.createdAt;
          if (createdAt instanceof Timestamp) createdAt = createdAt.toDate();
          else if (createdAt && typeof createdAt.toDate === 'function') createdAt = createdAt.toDate();
          else if (typeof createdAt === 'number') createdAt = new Date(createdAt);

          return {
            id: d.id,
            ...(data as any),
            createdAt,
            // usa linkUrl si no viene linkURL
            linkURL: data?.linkURL ?? data?.linkUrl ?? '',
            status: (data?.status as Entrega['status']) ?? 'pendiente',
          } as Entrega;
        });

        setItems(rows);
        setLoadingList(false);
      },
      () => setLoadingList(false)
    );

    return () => unsub();
  }, [loading, isTeacher]);

  async function setStatus(id: string, status: NonNullable<Entrega['status']>) {
    try {
      setBusyId(id);
      await updateDoc(doc(db, 'entregas', id), { status });
      setItems((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <main className="p-6">Cargando…</main>;

  if (!isTeacher) {
    return (
      <main className="p-6 space-y-3">
        <h1 className="text-xl font-semibold">Entregas</h1>
        <p className="text-muted-foreground">Acceso solo para profesorado.</p>
        <Button asChild variant="outline">
          <Link href="/maestro">Volver al panel</Link>
        </Button>
      </main>
    );
  }

  const visibles =
    filtro === 'todas' ? items : items.filter((e) => (e.status || 'pendiente') === filtro);

  return (
    <main className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button asChild variant="link" className="-ml-3">
            <Link href="/maestro">← Volver</Link>
          </Button>
          <h1 className="text-2xl font-bold">Entregas de alumnos</h1>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm">Estado:</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as any)}
          >
            <option value="todas">Todas</option>
            <option value="pendiente">Pendiente</option>
            <option value="revisada">Revisada</option>
            <option value="aprobada">Aprobada</option>
            <option value="rechazada">Rechazada</option>
          </select>
        </div>
      </div>

      {loadingList ? (
        <p>Cargando entregas…</p>
      ) : visibles.length === 0 ? (
        <p>No hay entregas para este filtro.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visibles.map((e) => {
            const createdAtMs =
              e.createdAt instanceof Date
                ? e.createdAt.getTime()
                : typeof (e.createdAt as any)?.toMillis === 'function'
                ? (e.createdAt as any).toMillis()
                : undefined;

            const link = e.linkURL || e.linkUrl || '';

            return (
              <Card key={e.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {e.alumnoNombre} {e.alumnoApellidos}{' '}
                    <span className="text-muted-foreground font-normal">
                      — Tarea {e.tareaId}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p>
                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        className="text-blue-600 underline"
                        rel="noreferrer"
                      >
                        Ver entrega
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Sin archivo/enlace</span>
                    )}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Estado:{' '}
                    <b className="capitalize">{(e.status || 'pendiente').toString()}</b>
                    {createdAtMs && ` · ${new Date(createdAtMs).toLocaleString()}`}
                    {e.source && ` · ${e.source}`}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={(e.status || 'pendiente') === 'pendiente' ? 'default' : 'outline'}
                      onClick={() => setStatus(e.id, 'pendiente')}
                      disabled={busyId === e.id}
                    >
                      Pendiente
                    </Button>
                    <Button
                      size="sm"
                      variant={e.status === 'revisada' ? 'default' : 'outline'}
                      onClick={() => setStatus(e.id, 'revisada')}
                      disabled={busyId === e.id}
                    >
                      Revisada
                    </Button>
                    <Button
                      size="sm"
                      variant={e.status === 'aprobada' ? 'default' : 'outline'}
                      onClick={() => setStatus(e.id, 'aprobada')}
                      disabled={busyId === e.id}
                    >
                      Aprobada
                    </Button>
                    <Button
                      size="sm"
                      variant={e.status === 'rechazada' ? 'default' : 'outline'}
                      onClick={() => setStatus(e.id, 'rechazada')}
                      disabled={busyId === e.id}
                    >
                      Rechazada
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
