// app/maestro/entregas/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Entrega = {
  id: string;
  tareaId?: string;
  alumnoNombre?: string;
  alumnoApellidos?: string;
  linkURL?: string;
  linkUrl?: string;
  createdAt?: any;
  status?: 'pendiente' | 'revisada' | 'aprobada' | 'rechazada';
  comentarioDocente?: string;
  familyId?: string;
  uid?: string;
  source?: 'public' | 'auth';
  [k: string]: any;
};

export default function MaestroEntregasPage() {
  const { user, role, loading } = useUserRole();
  const isTeacher = useMemo(() => role === 'teacher' || role === 'admin', [role]);

  const [items, setItems] = useState<Entrega[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | NonNullable<Entrega['status']>>('todas');
  const [comentarios, setComentarios] = useState<Record<string, string>>({});

  useEffect(() => {
    if (loading) return;
    if (!isTeacher) return;

    setLoadingList(true);
    const q = query(collection(db, 'entregas'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const rows: Entrega[] = snap.docs.map((d) => {
        const data = d.data() as any;
        let createdAt = data?.createdAt;
        if (createdAt instanceof Timestamp) createdAt = createdAt.toDate();
        else if (createdAt && typeof createdAt.toDate === 'function') createdAt = createdAt.toDate();
        else if (typeof createdAt === 'number') createdAt = new Date(createdAt);

        return {
          id: d.id,
          ...(data as any),
          createdAt,
          linkURL: data?.linkURL ?? data?.linkUrl ?? '',
          status: (data?.status as Entrega['status']) ?? 'pendiente',
          comentarioDocente: data?.comentarioDocente ?? '',
        };
      });

      setItems(rows);
      // Prefill comentarios si no existen en el estado
      setComentarios((prev) => {
        const next = { ...prev };
        rows.forEach((e) => {
          if (next[e.id] === undefined) next[e.id] = e.comentarioDocente ?? '';
        });
        return next;
      });

      setLoadingList(false);
    }, () => setLoadingList(false));

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

  async function guardarComentario(id: string) {
    const texto = comentarios[id] ?? '';
    try {
      setBusyId(id);
      await updateDoc(doc(db, 'entregas', id), { comentarioDocente: texto, updatedAt: new Date() });
      setItems((prev) => prev.map((e) => (e.id === id ? { ...e, comentarioDocente: texto } : e)));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <main className="p-6">Cargando…</main>;

  if (!user || !isTeacher) {
    return (
      <main className="container mx-auto p-6 space-y-3">
        <h1 className="text-xl font-semibold">Entregas</h1>
        <p className="text-muted-foreground">Acceso solo para profesorado.</p>
        <Button asChild variant="outline"><Link href="/maestro">Volver al panel</Link></Button>
      </main>
    );
  }

  const visibles = filtro === 'todas'
    ? items
    : items.filter((e) => (e.status || 'pendiente') === filtro);

  return (
    <main className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button asChild variant="link" className="-ml-3"><Link href="/maestro">← Volver</Link></Button>
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
            <option value="rechazada">Suspendida</option>
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
              e.createdAt instanceof Date ? e.createdAt.getTime()
              : typeof (e.createdAt as any)?.toMillis === 'function' ? (e.createdAt as any).toMillis()
              : undefined;
            const link = e.linkURL || e.linkUrl || '';
            const texto = comentarios[e.id] ?? e.comentarioDocente ?? '';

            return (
              <Card key={e.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {(e.alumnoNombre || 'Alumno') + ' ' + (e.alumnoApellidos || '')}
                    <span className="text-muted-foreground font-normal"> — Tarea {e.tareaId ?? '—'}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm">
                      {createdAtMs ? new Date(createdAtMs).toLocaleString() : '—'}
                      {e.source && <span className="text-muted-foreground"> · {e.source}</span>}
                    </p>
                    <span className="text-xs px-2 py-1 rounded-full border capitalize">
                      {e.status || 'pendiente'}
                    </span>
                  </div>

                  <p>
                    {link ? (
                      <a href={link} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                        Ver entrega
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Sin archivo/enlace</span>
                    )}
                  </p>

                  {/* Comentario del docente */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Comentario del docente</label>
                    <textarea
                      className="w-full min-h-[90px] rounded border p-2 text-sm"
                      placeholder="Escribe un comentario para el alumno/familia…"
                      value={texto}
                      onChange={(ev) =>
                        setComentarios((prev) => ({ ...prev, [e.id]: ev.target.value }))
                      }
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => guardarComentario(e.id)}
                        disabled={busyId === e.id}
                      >
                        Guardar comentario
                      </Button>
                    </div>
                  </div>

                  {/* Acciones de estado */}
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
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant={e.status === 'rechazada' ? 'default' : 'outline'}
                      onClick={() => setStatus(e.id, 'rechazada')}
                      disabled={busyId === e.id}
                    >
                      Suspender
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
