'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginEmail } from '@/hooks/useAuthUser';
import { getIdTokenResult } from 'firebase/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setErr(null);

      const cred = await loginEmail(email.trim(), pass);
      const token = await getIdTokenResult(cred.user, true);
      const role = token.claims.role as string | undefined;

      if (role === 'family') {
        router.push('/familia');
      } else if (role === 'admin' || role === 'teacher') {
        router.push('/maestro');
      } else {
        // Si no hay rol definido, te mando al inicio (o donde prefieras)
        router.push('/');
      }
    } catch (e: any) {
      // Traducción rápida de errores comunes de Firebase Auth
      const msg = String(e?.code || e?.message || '')
        .replace('Firebase:', '')
        .trim();

      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        setErr('Credenciales incorrectas.');
      } else if (msg.includes('auth/user-not-found')) {
        setErr('No existe una cuenta con ese email.');
      } else if (msg.includes('auth/too-many-requests')) {
        setErr('Demasiados intentos. Prueba más tarde.');
      } else {
        setErr('Error de inicio de sesión.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-bold">Acceder</h1>
      <form onSubmit={onSubmit} className="space-y-2">
        <input
          className="border p-2 w-full"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          autoFocus
        />
        <input
          className="border p-2 w-full"
          value={pass}
          onChange={e => setPass(e.target.value)}
          type="password"
          placeholder="Contraseña"
          autoComplete="current-password"
        />
        <button className="border px-3 py-2 w-full" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      {err && <p className="text-red-600 text-sm">{err}</p>}
    </div>
  );
}
