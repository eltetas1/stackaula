'use client';

// 🔌 Interruptor para evitar consultas a /entregas hasta que todo esté listo
const SHOW_ENTREGAS = false;

import { useEffect, useMemo, useState } from 'react';
import { useAuthUser } from '@/hooks/useAuthUser';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Query } from 'firebase/firestore';

type Entrega = { id: string; familyId: string; tareaId: string; linkURL: string };

export default function TareasPage() {
  const { user, loading } = useAuthUser(); // user?.role = 'teacher' | 'family'
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [entregasLoading, setEntregasLoading] = useState(false);

  // Permisos calculados una sola vez por cambio de user/loading
  const canReadEntregas = useMemo(() => {
    return !!user && (user.role === 'teacher' || user.role === 'family');
  }, [user]);

  // 1) Tareas/Avisos: (público). — tu lógica habitual aquí —

  // 2) ENTREGAS: SOLO si el interruptor está ON y hay sesión con permisos
  useEffect(() => {
    if (loading) return;
    if (!SHOW_ENTREGAS) return;        // ⛔️ corta aquí mientras el switch está en false
    if (!canReadEntregas) {
      setEntregas([]);
      return;
    }

    const fetchEntregas = async () => {
      setEntregasLoading(true);
      try {
        let qRef: Query;
        if (user!.role === 'teacher') {
          qRef = query(collection(db, 'entregas'));
        } else {
          // familia: solo sus entregas
          qRef = query(collection(db, 'entregas'), where('familyId', '==', user!.familyId));
        }
        const snap = await getDocs(qRef);
        setEntregas(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
      } catch (err) {
        console.error('No se pudieron cargar entregas:', err);
        setEntregas([]);
      } finally {
        setEntregasLoading(false);
      }
    };

    fetchEntregas();
  }, [loading, canReadEntregas, user]);

  // ---- RENDER ----
  if (loading) return <div className="p-4">Cargando…</div>;

  return (
    <main className="p-4">
      {/* 🔹 Lista de tareas públicas aquí (se puede renderizar siempre) */}

      {/* 🔒 Bloque de entregas: solo si el interruptor está ON y hay permisos */}
      {SHOW_ENTREGAS && canReadEntregas ? (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Entregas</h2>
          {entregasLoading ? (
            <p>Cargando entregas…</p>
          ) : entregas.length === 0 ? (
            <p>No hay entregas.</p>
          ) : (
            <ul className="list-disc pl-5">
              {entregas.map(e => (
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
