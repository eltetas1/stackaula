'use client';

import React, { useState } from 'react';
import { useAuthUser, loginEmail, logout } from '@/hooks/useAuthUser';
import { Button } from '@/components/ui/button';

type Props = {
  children: React.ReactNode;
  // opcional: restringir por rol
  requireRole?: 'teacher' | 'family';
};

export function AuthGate({ children, requireRole }: Props) {
  const { user, loading } = useAuthUser();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) {
    return <div className="p-6">Cargando…</div>;
  }

  // Si hay usuario, opcionalmente comprobamos el rol
  if (user) {
    if (requireRole && user.role !== requireRole) {
      return (
        <div className="p-6 space-y-3">
          <p>No tienes permisos para acceder a este contenido.</p>
          <div className="flex gap-2">
            <Button onClick={() => logout()}>Cerrar sesión</Button>
          </div>
        </div>
      );
    }
    // Usuario válido → muestra el contenido protegido
    return <>{children}</>;
  }

  // No hay usuario → formulario de login
  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await loginEmail(email.trim(), pass);
    } catch (err: any) {
      console.error(err);
      setError('No se pudo iniciar sesión. Revisa el correo/contraseña.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-sm p-6">
      <h2 className="text-xl font-semibold mb-3">Iniciar sesión</h2>
      <form onSubmit={onLogin} className="space-y-3">
        <div>
          <label className="block text-sm">Correo</label>
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
          <label className="block text-sm">Contraseña</label>
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
    </div>
  );
}

export default AuthGate;
