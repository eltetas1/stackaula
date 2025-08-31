// app/maestro/familias/page.tsx
'use client';

import Link from 'next/link';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CreateFamilyForm from '@/components/admin/CreateFamilyForm';

export default function MaestroFamiliasPage() {
  // 🔒 Permisos unificados: rol leído desde Firestore (users/{uid})
  const { user, role, loading } = useUserRole();
  const isTeacher = role === 'teacher' || role === 'admin';

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold">Comprobando permisos…</h1>
      </div>
    );
  }

  if (!user || !isTeacher) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold">Acceso restringido</h1>
        <p className="mt-2">Necesitas una cuenta de maestro para acceder a esta página.</p>
        <div className="mt-6 flex gap-2">
          <Button asChild>
            <Link href="/login">Ir al login</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/maestro">Volver al panel</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestionar familias</h1>
          <p className="text-gray-600">Crea nuevas familias y gestiona el acceso.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href="/maestro/familias/list">Gestionar todas</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/maestro">Volver al panel</Link>
          </Button>
        </div>
      </div>

      {/* Crear familia */}
      <Card>
        <CardHeader>
          <CardTitle>Crear familia</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateFamilyForm />
        </CardContent>
      </Card>
    </div>
  );
}
