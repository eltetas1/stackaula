'use client';

import Link from 'next/link';
import { useAuthClaims } from '@/hooks/useAuthClaims';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CreateFamilyForm from '@/components/admin/CreateFamilyForm';


export default function MaestroFamiliasPage() {
  const { user, claims, loading } = useAuthClaims();
  const role = (claims?.role as string | undefined) || null;
  const isTeacher = role === 'admin' || role === 'teacher';

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
        <Button asChild className="mt-4">
          <Link href="/login">Ir al login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestionar familias</h1>
          <p className="text-gray-600">Crea nuevas familias y gestiona el acceso.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/maestro">Volver al panel</Link>
        </Button>
      </div>

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
