'use client';
import { useState } from 'react';
import { useAuthUser, loginEmail, logout } from '@/hooks/useAuthUser';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, userDoc, loading } = useAuthUser();
  const [email, setEmail] = useState('moodlehamza@gmail.com');
  const [pass, setPass] = useState('17BJ#Moodle');

  if (loading) return <p className="p-6">Cargando…</p>;

  if (!user) {
    return (
      <div className="p-6 space-y-2">
        <h3>Login</h3>
        <input className="border p-2 w-64" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border p-2 w-64" type="password" value={pass} onChange={e=>setPass(e.target.value)} />
        <button className="border p-2" onClick={()=>loginEmail(email, pass)}>Entrar</button>
      </div>
    );
  }

  return (
    <div>
      <div className="p-3 border-b text-sm flex items-center gap-2">
        <span>Usuario: {user.email}</span>
        <span className="px-2 py-0.5 border rounded">{userDoc?.role ?? 'sin rol'}</span>
        <button className="ml-auto border px-2 py-1" onClick={logout}>Salir</button>
      </div>
      {children}
    </div>
  );
}
