'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { useAuthUser } from '@/hooks/useAuthUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Tarea = {
  id: string;
  title: string;
  body?: string;
  createdAtMs?: number;
};

export default function TareasPage() {
  const { user, loading } = useAuthUser(); // user?.role === 'family' | 'teacher' | undefined
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [tareasLoading, setTareasLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ——— CARGAR SOLO TAREAS PÚBLICAS ———
  useEffect(() => {
    const fetchTareas = async () => {
      setTareasLoading(true);
      setError(null);
      try {
        // Reglas: /avisos es de lectura pública
        const q = query(
          collection(db, 'avisos'),
          where('type', '==', 'tarea'),
          where('published', '==', true),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const snap = await getDocs(q);
        const rows = snap.docs.map((d) => {
          const data = d.data() as any;
          const createdAtMs =
            data?.createdAt && typeof data.createdAt.toMillis === 'function'
              ? data.createdAt.toMillis()
              : undefined;
          return {
            id: d.id,
            title: data.title ?? '(Sin título)',
            body: data.body ?? '',
            createdAtMs,
          } as Tarea;
        });
        setTareas(rows);
      } catch (e) {
        console.error('Error cargando tareas:', e);
        setError('No se pudieron cargar las tareas.');
        setTareas([]);
      } finally {
        setTareasLoading(false);
      }
    };

    fetchTareas();
  }, []);

  // ——— RENDER ———
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-4">Tareas</h1>

      {tareasLoading ? (
        <p>Cargando…</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : tareas.length === 0 ? (
        <p>No hay tareas publicadas.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tareas.map((t) => (
            <Card key={t.id} className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">{t.title}</CardTitle>
                {t.createdAtMs && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(t.createdAtMs).toLocaleString()}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {t.body && <p className="whitespace-pre-line">{t.body}</p>}

                {loading ? (
                  <Button disabled>Comprobando sesión…</Button>
                ) : user?.role === 'family' ? (
                  <Button asChild>
                    <Link href={`/familia/tareas/${t.id}/entregar`}>Entregar</Link>
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                      <Link href="/familia">Inicia sesión como familia</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
