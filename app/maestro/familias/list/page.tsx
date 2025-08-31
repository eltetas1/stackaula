// app/maestro/familias/list/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type FamilyRow = {
  id: string;     // uid del usuario
  name?: string;
  email?: string;
  familyId?: string | null;
  createdAt?: string;
};

export default function FamiliesListPage() {
  const { user, role, loading } = useAuthUser();
  const router = useRouter();
  const [rows, setRows] = useState<FamilyRow[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || role !== 'teacher') {
      router.replace('/'); // guard simple
      return;
    }
    (async () => {
      try {
        setBusy(true);
        // Leemos de users donde role == 'family'
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'family')
        );
        const snap = await getDocs(q);
        const data: FamilyRow[] = snap.docs.map((d) => {
          const v = d.data() as any;
          return {
            id: d.id,
            name: v.name ?? '',
            email: v.email ?? '',
            familyId: v.familyId ?? null,
            createdAt: v.createdAt?.toDate?.()?.toISOString?.() ?? '',
          };
        });
        // opcional: ordenar por nombre
        data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setRows(data);
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
                    <p className="font-medium">{r.name || '(sin nombre)'}</p>
                    <p className="text-sm text-muted-foreground">{r.email}</p>
                  </div>
                  <div className="flex gap-2">
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
