'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { Button } from '@/components/ui/button';
import { useAuthClaims } from '@/hooks/useAuthClaims';

type Tarea = {
  title: string;
  body?: string;
  subject?: { name?: string };
  createdAt?: any; // Timestamp
};

export default function TareaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, claims } = useAuthClaims();
  const isFamily = !!user && claims?.role === 'family';

  const [tarea, setTarea] = useState<Tarea | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDoc(doc(db, 'avisos', String(id)));
      if (snap.exists()) setTarea(snap.data() as Tarea);
      setLoading(false);
    };
    if (id) fetch();
  }, [id]);

  if (loading) return <div className="container mx-auto px-4 py-8">Cargando…</div>;
  if (!tarea) return <div className="container mx-auto px-4 py-8">Tarea no encontrada.</div>;

  return (
    <div className="container mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tarea</h1>
        <Button asChild variant="outline">
          <Link href="/tareas">Volver</Link>
        </Button>
      </div>

      <div className="rounded-xl border p-6 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{tarea.title}</h2>
          {tarea.subject?.name && (
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
              {tarea.subject.name}
            </span>
          )}
        </div>

        {tarea.body && (
          <p className="text-gray-700 whitespace-pre-line">{tarea.body}</p>
        )}

        {tarea.createdAt?.toDate && (
          <p className="text-xs text-gray-500">
            {tarea.createdAt.toDate().toLocaleString()}
          </p>
        )}

        {/* 🔹 Solo familias: botón Entregar */}
        {isFamily && (
          <div className="pt-3">
            <Button asChild>
              <Link href={`/familia/tareas/${id}/entregar`}>Entregar</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
