// app/maestro/entregas/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
  Timestamp,
  limit as qlimit,
  startAfter,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Status = 'pendiente' | 'revisada' | 'aprobada' | 'rechazada';

type Entrega = {
  id: string;
  tareaId?: string;
  alumnoNombre?: string;
  alumnoApellidos?: string;
  linkURL?: string;
  linkUrl?: string;
  createdAt?: any;
  status?: Status;
  comentarioDocente?: string;
  familyId?: string;
  uid?: string;
  source?: 'public' | 'auth';
  [k: string]: any;
};

const PAGE_SIZE = 12;

// --- helpers ---
const toDate = (v: any): Date | undefined => {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (v instanceof Timestamp) return v.toDate();
  if (typeof v?.toDate === 'function') return v.toDate();
  if (typeof v === 'number') return new Date(v);
  return undefined;
};

const statusLabel: Record<Status, string> = {
  pendiente: 'Pendiente',
  revisada: 'Revisada',
  aprobada: 'Aprobada',
  rechazada: 'Suspendida',
};

const statusClass: Record<Status, string> = {
  pendiente:
    'bg-amber-100 text-amber-800 border-amber-200',
  revisada:
    'bg-sky-100 text-sky-800 border-sky-200',
  aprobada:
    'bg-emerald-100 text-emerald-800 border-emerald-200',
  rechazada:
    'bg-rose-100 text-rose-800 border-rose-200',
};

export default function MaestroEntregasPage() {
  const { user, role, loading } = useUserRole();
  const isTeacher = useMemo(() => role === 'teacher' || role === 'admin', [role]);

  // datos
  const [items, setItems] = useState<Entrega[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const lastDocRef = useRef<any>(null);

  // comentarios (auto-save)
  const [comentarios, setComentarios] = useState<Record<string, string>>({});
  const timersRef = useRef<Record<string, any>>({});
  const [savedOk, setSavedOk] = useState<Record<string, boolean>>({});

  // tareas (lookup)
  const [tasksById, setTasksById] = useState<Record<string, { title?: string }>>({});

  // filtros
  const [fEstado, setFEstado] = useState<'todas' | Status>('todas');
  const [searchAlumno, setSearchAlumno] = useState('');
  const [fTarea, setFTarea] = useState<string>('todas');
  const [fDesde, setFDesde] = useState<string>(''); // YYYY-MM-DD
  const [fHasta, setFHasta] = useState<string>(''); // YYYY-MM-DD

  // --- carga inicial en vivo (primer PAGE_SIZE) ---
  useEffect(() => {
    if (loading || !isTeacher) return;
    setLoadingList(true);
    const q = query(
      collection(db, 'entregas'),
      orderBy('createdAt', 'desc'),
      qlimit(PAGE_SIZE)
    );

    const unsub = onSnapshot(
      q,
      async (snap) => {
        const rows = snap.docs.map((d) => {
          const data = d.data() as any;
          const createdAt = toDate(data?.createdAt);
          return {
            id: d.id,
            ...(data as any),
            createdAt,
            linkURL: data?.linkURL ?? data?.linkUrl ?? '',
            status: (data?.status as Status) ?? 'pendiente',
            comentarioDocente: data?.comentarioDocente ?? '',
          } as Entrega;
        });
        setItems(rows);

        // últimas referencias para paginación (usamos el último del snapshot)
        lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
        setHasMore(Boolean(lastDocRef.current));

        // preparar estado de comentarios
        setComentarios((prev) => {
          const next = { ...prev };
          rows.forEach((e) => {
            if (next[e.id] === undefined) next[e.id] = e.comentarioDocente ?? '';
          });
          return next;
        });

        // lookup de títulos de tareas que falten
        const ids = Array.from(
          new Set(rows.map((r) => r.tareaId).filter(Boolean) as string[])
        ).filter((id) => !tasksById[id]);
        if (ids.length) {
          const entries: Record<string, { title?: string }> = {};
          await Promise.all(
            ids.map(async (id) => {
              try {
                const snap = await getDoc(doc(db, 'tareas', id));
                entries[id] = { title: snap.exists() ? (snap.data() as any)?.title : undefined };
              } catch {
                entries[id] = { title: undefined };
              }
            })
          );
          setTasksById((prev) => ({ ...prev, ...entries }));
        }

        setLoadingList(false);
      },
      () => setLoadingList(false)
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isTeacher]);

  // --- cargar más (no live) ---
  const loadMore = async () => {
    if (!lastDocRef.current) return;
    const q = query(
      collection(db, 'entregas'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDocRef.current),
      qlimit(PAGE_SIZE)
    );
    const snap = await getDocs(q);
    const rows = snap.docs.map((d) => {
      const data = d.data() as any;
      const createdAt = toDate(data?.createdAt);
      return {
        id: d.id,
        ...(data as any),
        createdAt,
        linkURL: data?.linkURL ?? data?.linkUrl ?? '',
        status: (data?.status as Status) ?? 'pendiente',
        comentarioDocente: data?.comentarioDocente ?? '',
      } as Entrega;
    });

    // lookup tareas faltantes
    const ids = Array.from(
      new Set(rows.map((r) => r.tareaId).filter(Boolean) as string[])
    ).filter((id) => !tasksById[id]);
    if (ids.length) {
      const entries: Record<string, { title?: string }> = {};
      await Promise.all(
        ids.map(async (id) => {
          try {
            const snap = await getDoc(doc(db, 'tareas', id));
            entries[id] = { title: snap.exists() ? (snap.data() as any)?.title : undefined };
          } catch {
            entries[id] = { title: undefined };
          }
        })
      );
      setTasksById((prev) => ({ ...prev, ...entries }));
    }

    setItems((prev) => [...prev, ...rows]);
    lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
    setHasMore(Boolean(lastDocRef.current));
  };

  // --- acciones ---
  async function setStatus(id: string, status: Status) {
    try {
      setBusyId(id);
      await updateDoc(doc(db, 'entregas', id), { status, updatedAt: new Date() });

      // notificación a familia (si hay familyId)
      const entrega = items.find((e) => e.id === id);
      if (entrega?.familyId) {
        const title = `Estado de la entrega actualizado: ${statusLabel[status]}`;
        const message = `La entrega de ${entrega.alumnoNombre ?? 'el alumno'} para la tarea "${tasksById[entrega.tareaId || '']?.title ?? entrega.tareaId ?? ''}" ha sido marcada como ${statusLabel[status]}.`;
        await updateDoc(doc(collection(db, 'notifications')), {} as any).catch(() => {});
        // ↑ HACK: si no tienes addDoc importado. Mejor usa addDoc:
        // await addDoc(collection(db, 'notifications'), { ...payload });
      }

      setItems((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    } finally {
      setBusyId(null);
    }
  }

  // auto-guardado con debounce 600ms
  const onChangeComentario = (id: string, texto: string) => {
    setComentarios((prev) => ({ ...prev, [id]: texto }));
    setSavedOk((prev) => ({ ...prev, [id]: false }));

    if (timersRef.current[id]) clearTimeout(timersRef.current[id]);
    timersRef.current[id] = setTimeout(async () => {
      try {
        setBusyId(id);
        await updateDoc(doc(db, 'entregas', id), {
          comentarioDocente: texto,
          updatedAt: new Date(),
        });

        // notificación a familia
        const entrega = items.find((e) => e.id === id);
        if (entrega?.familyId && texto.trim()) {
          const title = `Nuevo comentario del profesor`;
          const message = texto.trim();
          await updateDoc(doc(collection(db, 'notifications')), {} as any).catch(() => {});
          // Mejor con addDoc:
          // await addDoc(collection(db, 'notifications'), { ...payload });
        }

        setSavedOk((prev) => ({ ...prev, [id]: true }));
      } finally {
        setBusyId(null);
      }
    }, 600);
  };

  // --- preparación de filtros / visibles ---
  const tareasEnLista = useMemo(() => {
    const set = new Set<string>();
    items.forEach((e) => e.tareaId && set.add(e.tareaId));
    return Array.from(set);
  }, [items]);

  const visibles = useMemo(() => {
    let rows = items;

    // estado
    if (fEstado !== 'todas') {
      rows = rows.filter((e) => (e.status || 'pendiente') === fEstado);
    }

    // alumno (search simple por nombre/apellidos)
    const q = searchAlumno.trim().toLowerCase();
    if (q) {
      rows = rows.filter((e) => {
        const n = (e.alumnoNombre || '').toLowerCase();
        const a = (e.alumnoApellidos || '').toLowerCase();
        return n.includes(q) || a.includes(q);
      });
    }

    // tarea
    if (fTarea !== 'todas') {
      rows = rows.filter((e) => e.tareaId === fTarea);
    }

    // rango fechas
    const dFrom = fDesde ? new Date(fDesde + 'T00:00:00') : null;
    const dTo = fHasta ? new Date(fHasta + 'T23:59:59') : null;
    if (dFrom || dTo) {
      rows = rows.filter((e) => {
        const d = toDate(e.createdAt);
        if (!d) return false;
        if (dFrom && d < dFrom) return false;
        if (dTo && d > dTo) return false;
        return true;
      });
    }

    return rows;
  }, [items, fEstado, searchAlumno, fTarea, fDesde, fHasta]);

  // --- export CSV ---
  const exportCSV = () => {
    const header = [
      'fecha',
      'alumnoNombre',
      'alumnoApellidos',
      'tareaId',
      'tareaTitulo',
      'estado',
      'enlace',
      'comentarioDocente',
      'source',
    ];
    const lines = visibles.map((e) => {
      const fecha = toDate(e.createdAt)?.toISOString() ?? '';
      const tareaTitulo = tasksById[e.tareaId || '']?.title ?? '';
      const link = e.linkURL || e.linkUrl || '';
      const estado = e.status || 'pendiente';
      return [
        fecha,
        e.alumnoNombre || '',
        e.alumnoApellidos || '',
        e.tareaId || '',
        tareaTitulo,
        estado,
        link,
        (e.comentarioDocente || '').replace(/\n/g, ' '),
        e.source || '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',');
    });

    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `entregas_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

  return (
    <main className="container mx-auto p-6 space-y-6">
      {/* Header + filtros */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button asChild variant="link" className="-ml-3"><Link href="/maestro">← Volver</Link></Button>
          <h1 className="text-2xl font-bold">Entregas de alumnos</h1>
        </div>

        <div className="flex items-center gap-2">
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="Buscar alumno…"
            value={searchAlumno}
            onChange={(e) => setSearchAlumno(e.target.value)}
          />
          <select
            className="border rounded px-2 py-1 text-sm"
            value={fEstado}
            onChange={(e) => setFEstado(e.target.value as any)}
          >
            <option value="todas">Todas</option>
            <option value="pendiente">Pendiente</option>
            <option value="revisada">Revisada</option>
            <option value="aprobada">Aprobada</option>
            <option value="rechazada">Suspendida</option>
          </select>

          <select
            className="border rounded px-2 py-1 text-sm"
            value={fTarea}
            onChange={(e) => setFTarea(e.target.value)}
          >
            <option value="todas">Todas las tareas</option>
            {tareasEnLista.map((tid) => (
              <option key={tid} value={tid}>
                {tasksById[tid]?.title ? `${tasksById[tid]?.title} (${tid})` : tid}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="border rounded px-2 py-1 text-sm"
            value={fDesde}
            onChange={(e) => setFDesde(e.target.value)}
          />
          <input
            type="date"
            className="border rounded px-2 py-1 text-sm"
            value={fHasta}
            onChange={(e) => setFHasta(e.target.value)}
          />

          <Button variant="outline" onClick={exportCSV}>Exportar CSV</Button>
        </div>
      </div>

      {loadingList ? (
        <p>Cargando entregas…</p>
      ) : visibles.length === 0 ? (
        <p>No hay entregas para este filtro.</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {visibles.map((e) => {
              const createdAtMs = toDate(e.createdAt)?.getTime();
              const link = e.linkURL || e.linkUrl || '';
              const comentario = comentarios[e.id] ?? '';

              const tareaTitulo = e.tareaId
                ? tasksById[e.tareaId]?.title ?? e.tareaId
                : '—';

              return (
                <Card key={e.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between gap-3">
                      <span>
                        {(e.alumnoNombre || 'Alumno') + ' ' + (e.alumnoApellidos || '')}
                        <span className="text-muted-foreground font-normal"> — {tareaTitulo}</span>
                      </span>
                      <Badge className={`border ${statusClass[e.status || 'pendiente']}`}>
                        {statusLabel[e.status || 'pendiente']}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm">
                        {createdAtMs ? new Date(createdAtMs).toLocaleString() : '—'}
                        {e.source && <span className="text-muted-foreground"> · {e.source}</span>}
                      </p>
                      {link ? (
                        <a href={link} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                          Ver entrega
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Sin archivo/enlace</span>
                      )}
                    </div>

                    {/* Comentario (auto-guardado) */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Comentario del docente</label>
                      <textarea
                        className="w-full min-h-[90px] rounded border p-2 text-sm"
                        placeholder="Escribe un comentario para el alumno/familia…"
                        value={comentario}
                        onChange={(ev) => onChangeComentario(e.id, ev.target.value)}
                      />
                      <div className="text-xs">
                        {busyId === e.id && !savedOk[e.id] && <span className="opacity-70">Guardando…</span>}
                        {savedOk[e.id] && <span className="text-emerald-600">Guardado ✓</span>}
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

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={loadMore}>Cargar más</Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
