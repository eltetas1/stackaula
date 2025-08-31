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
  addDoc,
  serverTimestamp,
  where,
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
  nota?: number | null; // ← NUEVO
  familyId?: string;
  uid?: string;
  source?: 'public' | 'auth';
  [k: string]: any;
};

const PAGE_SIZE = 12;

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
  pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  revisada: 'bg-sky-100 text-sky-800 border-sky-200',
  aprobada: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rechazada: 'bg-rose-100 text-rose-800 border-rose-200',
};

export default function MaestroEntregasPage() {
  const { user, role, loading } = useUserRole();
  const isTeacher = useMemo(() => role === 'teacher' || role === 'admin', [role]);

  const [items, setItems] = useState<Entrega[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const lastDocRef = useRef<any>(null);

  // estado local: comentarios y notas con autosave
  const [comentarios, setComentarios] = useState<Record<string, string>>({});
  const [notas, setNotas] = useState<Record<string, string>>({});
  const timersRef = useRef<Record<string, any>>({});
  const [savedOk, setSavedOk] = useState<Record<string, boolean>>({});

  // lookup títulos de tareas
  const [tasksById, setTasksById] = useState<Record<string, { title?: string }>>({});

  // filtros
  const [fEstado, setFEstado] = useState<'todas' | Status>('todas');
  const [searchAlumno, setSearchAlumno] = useState('');
  const [fTarea, setFTarea] = useState<string>('todas');
  const [fDesde, setFDesde] = useState<string>(''); // YYYY-MM-DD
  const [fHasta, setFHasta] = useState<string>(''); // YYYY-MM-DD

  // carga en vivo (primer bloque)
  useEffect(() => {
    if (loading || !isTeacher) return;
    setLoadingList(true);

    const base = query(collection(db, 'entregas'), orderBy('createdAt', 'desc'), qlimit(PAGE_SIZE));
    const unsub = onSnapshot(
      base,
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
            nota: typeof data?.nota === 'number' ? data.nota : null,
          } as Entrega;
        });
        setItems(rows);

        lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
        setHasMore(Boolean(lastDocRef.current));

        // precargar controles
        setComentarios((prev) => {
          const next = { ...prev };
          rows.forEach((e) => {
            if (next[e.id] === undefined) next[e.id] = e.comentarioDocente ?? '';
          });
          return next;
        });
        setNotas((prev) => {
          const next = { ...prev };
          rows.forEach((e) => {
            if (next[e.id] === undefined) next[e.id] = e.nota != null ? String(e.nota) : '';
          });
          return next;
        });

        // lookup títulos de tareas
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

        setLoadingList(false);
      },
      () => setLoadingList(false)
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isTeacher]);

  const loadMore = async () => {
    if (!lastDocRef.current) return;
    const q2 = query(
      collection(db, 'entregas'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDocRef.current),
      qlimit(PAGE_SIZE)
    );
    const snap = await getDocs(q2);
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
        nota: typeof data?.nota === 'number' ? data.nota : null,
      } as Entrega;
    });

    // lookup tareas
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

    setItems((prev) => [...prev, ...rows]);
    lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
    setHasMore(Boolean(lastDocRef.current));
  };

  // notificación “in-app” en colección notifications
  async function portalNotify(entrega: Entrega, title: string, message: string) {
    if (!entrega.familyId) return;
    await addDoc(collection(db, 'notifications'), {
      type: 'entrega_update',
      familyId: entrega.familyId,
      entregaId: entrega.id,
      title,
      message,
      status: 'unread',
      createdAt: serverTimestamp(),
    });
  }

  async function setStatus(id: string, status: Status) {
    try {
      setBusyId(id);
      await updateDoc(doc(db, 'entregas', id), { status, updatedAt: new Date() });

      const entrega = items.find((e) => e.id === id);
      if (entrega) {
        await portalNotify(
          entrega,
          `Estado actualizado: ${statusLabel[status]}`,
          `Tu entrega para "${tasksById[entrega.tareaId || '']?.title ?? entrega.tareaId ?? ''}" ha sido marcada como ${statusLabel[status]}.`
        );
      }

      setItems((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    } finally {
      setBusyId(null);
    }
  }

  // autosave generic (para comentario / nota)
  const debouncedSave = (key: string, fn: () => Promise<void>) => {
    if (timersRef.current[key]) clearTimeout(timersRef.current[key]);
    timersRef.current[key] = setTimeout(async () => {
      await fn();
      setSavedOk((prev) => ({ ...prev, [key]: true }));
    }, 600);
  };

  const onChangeComentario = (id: string, texto: string) => {
    setComentarios((prev) => ({ ...prev, [id]: texto }));
    setSavedOk((prev) => ({ ...prev, [id + ':c']: false }));
    debouncedSave(id + ':c', async () => {
      setBusyId(id);
      await updateDoc(doc(db, 'entregas', id), {
        comentarioDocente: texto,
        updatedAt: new Date(),
      });
      const e = items.find((x) => x.id === id);
      if (e && e.familyId && texto.trim()) {
        await portalNotify(e, 'Nuevo comentario del profesor', texto.trim());
      }
      setBusyId(null);
    });
  };

  const onChangeNota = (id: string, valor: string) => {
    // guardamos vacío o número válido entre 0 y 10
    const parsed = valor === '' ? '' : String(Math.max(0, Math.min(10, Number(valor))));
    setNotas((prev) => ({ ...prev, [id]: parsed }));
    setSavedOk((prev) => ({ ...prev, [id + ':n']: false }));
    debouncedSave(id + ':n', async () => {
      setBusyId(id);
      const notaField = parsed === '' ? null : Number(parsed);
      await updateDoc(doc(db, 'entregas', id), {
        nota: notaField,
        updatedAt: new Date(),
      });
      const e = items.find((x) => x.id === id);
      if (e && e.familyId && notaField != null) {
        await portalNotify(
          e,
          'Nueva nota publicada',
          `Tu entrega de "${tasksById[e.tareaId || '']?.title ?? e.tareaId ?? ''}" ha sido calificada con ${notaField}.`
        );
      }
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, nota: notaField } : x)));
      setBusyId(null);
    });
  };

  // opciones para filtros en cliente
  const tareasEnLista = useMemo(() => {
    const set = new Set<string>();
    items.forEach((e) => e.tareaId && set.add(e.tareaId));
    return Array.from(set);
  }, [items]);

  const visibles = useMemo(() => {
    let rows = items;
    if (fEstado !== 'todas') rows = rows.filter((e) => (e.status || 'pendiente') === fEstado);
    const qtxt = searchAlumno.trim().toLowerCase();
    if (qtxt) {
      rows = rows.filter((e) => {
        const n = (e.alumnoNombre || '').toLowerCase();
        const a = (e.alumnoApellidos || '').toLowerCase();
        return n.includes(qtxt) || a.includes(qtxt);
      });
    }
    if (fTarea !== 'todas') rows = rows.filter((e) => e.tareaId === fTarea);
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
          <select className="border rounded px-2 py-1 text-sm" value={fEstado} onChange={(e) => setFEstado(e.target.value as any)}>
            <option value="todas">Todas</option>
            <option value="pendiente">Pendiente</option>
            <option value="revisada">Revisada</option>
            <option value="aprobada">Aprobada</option>
            <option value="rechazada">Suspendida</option>
          </select>
          <select className="border rounded px-2 py-1 text-sm" value={fTarea} onChange={(e) => setFTarea(e.target.value)}>
            <option value="todas">Todas las tareas</option>
            {tareasEnLista.map((tid) => (
              <option key={tid} value={tid}>
                {tasksById[tid]?.title ? `${tasksById[tid]?.title} (${tid})` : tid}
              </option>
            ))}
          </select>
          <input type="date" className="border rounded px-2 py-1 text-sm" value={fDesde} onChange={(e) => setFDesde(e.target.value)} />
          <input type="date" className="border rounded px-2 py-1 text-sm" value={fHasta} onChange={(e) => setFHasta(e.target.value)} />
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
              const notaTxt = notas[e.id] ?? '';
              const tareaTitulo = e.tareaId ? (tasksById[e.tareaId]?.title ?? e.tareaId) : '—';

              return (
                <Card key={e.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between gap-3">
                      <span>
                        {(e.alumnoNombre || 'Alumno') + ' ' + (e.alumnoApellidos || '')}
                        <span className="text-muted-foreground font-normal"> — {tareaTitulo}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge className={`border ${statusClass[e.status || 'pendiente']}`}>
                          {statusLabel[e.status || 'pendiente']}
                        </Badge>
                        <span className="text-sm font-semibold">
                          Nota: {e.nota != null ? e.nota : '—'}
                        </span>
                      </div>
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

                    {/* Comentario (autosave) */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Comentario del docente</label>
                      <textarea
                        className="w-full min-h-[90px] rounded border p-2 text-sm"
                        placeholder="Escribe un comentario para el alumno/familia…"
                        value={comentario}
                        onChange={(ev) => onChangeComentario(e.id, ev.target.value)}
                      />
                      <div className="text-xs">
                        {busyId === e.id && !savedOk[e.id + ':c'] && <span className="opacity-70">Guardando…</span>}
                        {savedOk[e.id + ':c'] && <span className="text-emerald-600">Guardado ✓</span>}
                      </div>
                    </div>

                    {/* Nota (autosave) */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nota (0–10)</label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.1}
                        className="w-32 rounded border px-2 py-1 text-sm"
                        value={notaTxt}
                        onChange={(e2) => onChangeNota(e.id, e2.target.value)}
                      />
                      <div className="text-xs">
                        {busyId === e.id && !savedOk[e.id + ':n'] && <span className="opacity-70">Guardando…</span>}
                        {savedOk[e.id + ':n'] && <span className="text-emerald-600">Guardado ✓</span>}
                      </div>
                    </div>

                    {/* Acciones de estado */}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant={(e.status || 'pendiente') === 'pendiente' ? 'default' : 'outline'} onClick={() => setStatus(e.id, 'pendiente')} disabled={busyId === e.id}>Pendiente</Button>
                      <Button size="sm" variant={e.status === 'revisada' ? 'default' : 'outline'} onClick={() => setStatus(e.id, 'revisada')} disabled={busyId === e.id}>Revisada</Button>
                      <Button size="sm" variant={e.status === 'aprobada' ? 'default' : 'outline'} onClick={() => setStatus(e.id, 'aprobada')} disabled={busyId === e.id}>Aprobar</Button>
                      <Button size="sm" variant={e.status === 'rechazada' ? 'default' : 'outline'} onClick={() => setStatus(e.id, 'rechazada')} disabled={busyId === e.id}>Suspender</Button>
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
