'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthClaims } from '@/hooks/useAuthClaims';
import { Button } from '@/components/ui/button';
import SubmitTareaForm from '@/components/familia/SubmitTareaForm';
import { db } from '@/lib/firebaseClient'; // si en tu app usas '@/lib/firebase', cámbialo aquí también
import { doc, getDoc } from 'firebase/firestore';
import { ensureFamilyClaims } from '@/lib/ensureFamilyClaims';

type Tarea = { title: string; body?: string };

export default function EntregarTareaPage() {
  const { tareaId } = useParams<{ tareaId: string }>();
  const { user, claims, loading } = useAuthClaims();
  const [tarea, setTarea] = useState<Tarea | null>(null);

  // Asegura que las claims existen cuando el usuario inicia sesión (opcional)
  useEffect(() => {
    if (!loading && user) {
      ensureFamilyClaims().catch(() => {});
    }
  }, [loading, user]);

  // Cargar la tarea pública desde /avisos/{tareaId}
  useEffect(() => {
    const fetch = async () => {
      const snap = await getDoc(doc(db, 'avisos', String(tareaId)));
      if (snap.exists()) setTarea(snap.data() as Tarea);
    };
    if (tareaId) fetch();
  }, [tareaId]);

  // Estados de acceso
  if (loading) return <div className="p-6">Cargando…</div>;
  if (!user || claims?.role !== 'family' || !claims?.familyId) {
    return (
      <div className="p-6">
        <p>Debes iniciar sesión como familia.</p>
        <Button asChild className="mt-4">
          <Link href="/familia">Ir al portal</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Entregar tarea</h1>
        <Button asChild variant="outline">
          <Link href="/familia">Volver</Link>
        </Button>
      </div>

      {tarea ? (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{tarea.title}</h2>
          {tarea.body && (
            <p className="text-muted-foreground whitespace-pre-line">{tarea.body}</p>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground">Cargando tarea…</p>
      )}

      {/* El formulario ya NO necesita familyId ni alumno: los obtiene del usuario logueado */}
      <SubmitTareaForm tareaId={String(tareaId)} />
    </div>
  );
}
