'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthUser, logout } from '@/hooks/useAuthUser';

export default function HomePage() {
  const { user, loading } = useAuthUser();

  const panel = user?.role === 'teacher' ? '/maestro' : '/tareas';

  return (
    <main className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
      <h1 className="text-3xl font-bold">Bienvenido al Aula CEIP</h1>

      {loading ? (
        <p>Cargando…</p>
      ) : user ? (
        <>
          <p className="text-sm text-muted-foreground">
            Sesión iniciada como <b>{user.email || user.uid}</b>
          </p>
          <div className="flex gap-3">
            <Button asChild size="lg" className="px-6">
              <Link href={panel}>Ir al panel</Link>
            </Button>
            <Button variant="outline" onClick={() => logout()}>
              Cerrar sesión
            </Button>
          </div>
        </>
      ) : (
        <Button asChild size="lg" className="px-8 py-4 text-lg">
          <Link href="/login">Login</Link>
        </Button>
      )}
    </main>
  );
}
