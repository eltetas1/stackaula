// app/maestro/familias/list/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type FamilyDoc = {
  id: string;
  guardianName?: string;
  studentName?: string;
  email?: string;
  classroom?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export default function FamiliesListPage() {
  const { user, role, loading } = useAuthUser();
  const router = useRouter();
  const [rows, setRows] = useState<FamilyDoc[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || role !== 'teacher') {
      router.replace('/'); // guard simple
      return;
    }
    (async () => {
      setBusy(true);
      try {
        // Leemos TODOS los docs de la colección families
        // (si más tarde quieres solo activos: añade where('active','==',true))
        const q = query(collection(db, 'families'));
        const snap = await getDocs(q);
        const list: FamilyDoc[] = snap.docs.map((d) => {
          const v = d.data() as any;
          const createdAt =
            v.createdAt?.toDate?.()?.toISOString?.() ??
            v.createdAt?.toISOString?.() ??
            '';
          const updatedAt =
            v.updatedAt?.toDate?.()?.toISOString?.() ??
            v.updatedAt?.toISOString?.() ??
            '';
          return {
            id: d.id,
            guardianName: v.guardianName ?? '',
            studentName: v.studentName ?? '',
            email: v.email ?? '',
            classroom: v.classroom ?? '',
            active: typeof v.active === 'boolean' ? v.active : undefined,
            createdAt,
            updatedAt,
          };
        });

        // Orden opcional por tutor (guardianName) y luego por alumno (studentName)
        list.sort((a, b) => {
          const g = (a.guardianName || '').localeCompare(b.guardianName || '');
          if (g !== 0) return g;
          return (a.studentName || '').localeCompare(b.studentName || '');
        });

        setRows(list);
      } finally {
        setBusy(false);
      }
    })();
  }, [user, role, loading, router]);

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Todas las familias</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push('/maestro')}>
            Volver al panel
          </Button>
          <Button onClick={() => router.push('/maestro/familias/new')}>
            Crear familia
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de familias</CardTitle>
        </CardHeader>
        <CardContent>
          {busy ? (
            <p className="text-sm">Cargando…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay familias registradas.</p>
          ) : (
            <ul className="divide-y">
              {rows.map((r) => (
                <li key={r.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {r.guardianName || '(sin nombre)'} {r.studentName ? `— Alumno/a: ${r.studentName}` : ''}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {r.email} {r.classroom ? `· ${r.classroom}` : ''}{' '}
                      {typeof r.active === 'boolean' ? (r.active ? '· Activa' : '· Inactiva') : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {/* Ajusta la ruta de detalle si ya tienes una página /maestro/familias/[id] */}
                    <Button variant="secondary" onClick={() => router.push(`/maestro/familias/${r.id}`)}>
                      Ver
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
