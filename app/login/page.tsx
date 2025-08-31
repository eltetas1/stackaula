'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthUser, loginEmail } from '@/hooks/useAuthUser';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { user, loading } = useAuthUser();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si ya está logueado, redirige automáticamente
  useEffect(() => {
    if (loading) return;
    if (user) {
      const dest = user.role === 'teacher' ? '/maestro' : '/tareas';
      router.replace(dest);
    }
  }, [user, loading, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await loginEmail(email.trim(), pass);
      // El useEffect se encargará de redirigir cuando el hook detecte el usuario
    } catch (err: any) {
      setError('No se pudo iniciar sesión. Revisa correo/contraseña.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-sm mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Iniciar sesión</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Correo</label>
          <input
            type="email"
            className="w-full border rounded p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Contraseña</label>
          <input
            type="password"
            className="w-full border rounded p-2"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </main>
  );
}
