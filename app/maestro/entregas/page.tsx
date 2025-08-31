'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthUser } from '@/hooks/useAuthUser';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  orderBy,
  query,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Entrega = {
  id: string;
  tareaId: string;
  alumnoNombre: string;
  alumnoApellidos: string;
  linkURL: string;
  createdAt?: any; // Timestamp
  status?: 'pendiente' | 'revisada' | 'aprobada' | 'rechazada';
  familyId?: string;
  uid?: string;
  source?: 'public' | 'auth';
};

export default function MaestroEntregasPage() {
  const { user, loading } = useAuthUser();
  const isTeacher = useMemo(() => user?.role === 'teacher', [user]);

  const [items, setItems] = useState<Entrega[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | Entrega['status']>('todas');

  useEffect(() => {
    if (loading) return;
    if (!isTeacher) return;

    const fetchEntregas = async () => {
      setLoadingList(true);
      const q = query(collection(db, 'entregas'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Entrega[];
      setItems(rows);
      setLoadingList(false);
    };

    fetchEntregas();
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
  if (!isTeacher)
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Entregas</h1>
        <p className="text-muted-foreground">Acceso solo para profesorado.</p>
      </main>
    );

  const visibles =
    filtro === 'todas' ? items : items.filter((e) => (e.status || 'pendiente') === filtro);

  return (
    <main className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Entregas de alumnos</h1>
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
              e.createdAt && typeof (e.createdAt as any).toMillis === 'function'
                ? (e.createdAt as any).toMillis()
                : undefined;

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
                    <a
                      href={e.linkURL}
                      target="_blank"
                      className="text-blue-600 underline"
                      rel="noreferrer"
                    >
                      Ver entrega
                    </a>
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
