'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginEmail } from '@/hooks/useAuthUser';

export default function LoginPage() {
  const [email, setEmail] = useState('moodlehamza@gmail.com'); // tu email de profe
  const [pass, setPass] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setErr(null);
      await loginEmail(email, pass);
      router.push('/maestro');
    } catch (e: any) {
      setErr(e.message ?? 'Error de inicio de sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-bold">Acceder</h1>
      <form onSubmit={onSubmit} className="space-y-2">
        <input className="border p-2 w-full" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
        <input className="border p-2 w-full" value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="Contraseña" />
        <button className="border px-3 py-2 w-full" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
      </form>
      {err && <p className="text-red-600 text-sm">{err}</p>}
    </div>
  );
}
