'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthUser } from '@/hooks/useAuthUser';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

type Entrega = { id: string; familyId: string; tareaId: string; linkURL: string };

export default function TareasPage() {
  const { user, loading } = useAuthUser();
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [entregasLoading, setEntregasLoading] = useState(false);

  const canReadEntregas = useMemo(() => {
    return !!user && (user.role === 'teacher' || user.role === 'family');
  }, [user]);

  // TODO: aquí va tu fetch de TAREAS públicas (avisos con type = 'tarea')

  useEffect(() => {
    if (loading) return;
    if (!canReadEntregas) {
      setEntregas([]);
      return;
    }

    const fetchEntregas = async () => {
      setEntregasLoading(true);
      try {
        const q =
          user!.role === 'teacher'
            ? query(collection(db, 'entregas'))
            : query(collection(db, 'entregas'), where('familyId', '==', user!.familyId));
        const snap = await getDocs(q);
        setEntregas(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      } catch (e) {
        console.error('Error cargando entregas:', e);
        setEntregas([]); // no bloquees la UI
      } finally {
        setEntregasLoading(false);
      }
    };

    fetchEntregas();
  }, [loading, canReadEntregas, user]);

  if (loading) return <div className="p-4">Cargando…</div>;

  return (
    <main className="p-4">
      {/* Aquí renderiza tus tareas públicas */}

      {canReadEntregas ? (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Entregas</h2>
          {entregasLoading ? (
            <p>Cargando entregas…</p>
          ) : entregas.length === 0 ? (
            <p>No hay entregas.</p>
          ) : (
            <ul className="list-disc pl-5">
              {entregas.map((e) => (
                <li key={e.id}>
                  {e.tareaId} — {e.linkURL}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </main>
  );
}
