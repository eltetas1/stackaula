'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebaseClient';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';

export default function ResetPasswordPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const oobCode = sp.get('oobCode') || '';
  const [pwd, setPwd] = useState('');
  const [checking, setChecking] = useState(true);
  const [codeOk, setCodeOk] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        if (!oobCode) throw new Error('Falta el código.');
        await verifyPasswordResetCode(auth, oobCode);
        setCodeOk(true);
      } catch (e: any) {
        setErr('El enlace no es válido o ha caducado. Vuelve a solicitar la invitación.');
      } finally {
        setChecking(false);
      }
    }
    check();
  }, [oobCode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setErr(null);
      await confirmPasswordReset(auth, oobCode, pwd);
      setMsg('Contraseña creada. Redirigiendo al login…');
      setTimeout(() => router.push('/login'), 1000);
    } catch (e: any) {
      setErr('No se pudo crear la contraseña. Pide una nueva invitación.');
    } finally {
      setLoading(false);
    }
  }

  if (checking) return <div className="p-6">Comprobando enlace…</div>;
  if (!codeOk) return <div className="p-6 text-red-600">{err}</div>;

  return (
    <div className="p-6 max-w-sm space-y-3">
      <h1 className="text-xl font-semibold">Crear contraseña</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="border rounded p-2 w-full"
          type="password"
          placeholder="Nueva contraseña"
          value={pwd}
          onChange={e=>setPwd(e.target.value)}
          required
        />
        <button className="border rounded p-2" disabled={loading}>
          {loading ? 'Guardando…' : 'Guardar'}
        </button>
        {msg && <p className="text-green-600 text-sm">{msg}</p>}
        {err && <p className="text-red-600 text-sm">{err}</p>}
      </form>
    </div>
  );
}
