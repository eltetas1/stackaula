// app/login/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthUser } from '@/hooks/useAuthUser';

export default function LoginPage() {
  const router = useRouter();
  const { user, role, loading } = useAuthUser();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'verifying'|'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Si ya está logueado, redirige
  useEffect(() => {
    if (!loading && user) {
      if (role === 'teacher') router.replace('/maestro');
      else router.replace('/');
    }
  }, [user, role, loading, router]);

  // Manejo del enlace mágico al abrir /login con el link de Firebase
  useEffect(() => {
    const run = async () => {
      if (typeof window === 'undefined') return;
      const href = window.location.href;

      if (isSignInWithEmailLink(auth, href)) {
        setStatus('verifying');
        try {
          let stored = window.localStorage.getItem('loginEmail') || '';
          if (!stored) {
            // Por si se abre en otro dispositivo/navegador
            stored = window.prompt('Introduce tu correo para completar el acceso') || '';
          }
          const result = await signInWithEmailLink(auth, stored, href);
          window.localStorage.removeItem('loginEmail');

          // Redirige según rol al efecto del hook (arriba)
          if (result.user) {
            // NOP — el efecto de arriba redirige
          }
        } catch (e: any) {
          setError(e?.message ?? 'No se pudo verificar el enlace.');
          setStatus('error');
        }
      }
    };
    run();
  }, []);

  const handleSendLink = async () => {
    setError(null);
    if (!email || !email.includes('@')) {
      setError('Introduce un correo válido');
      return;
    }
    setStatus('sending');
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('loginEmail', email);
      setStatus('sent');
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo enviar el enlace');
      setStatus('error');
    }
  };

  return (
    <div className="mx-auto max-w-md p-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Acceder al aula</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'verifying' ? (
            <p>Verificando enlace…</p>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm">Correo electrónico</label>
                <Input
                  type="email"
                  placeholder="nombre@colegio.es"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              {status === 'sent' ? (
                <p className="text-sm">Te hemos enviado un enlace de acceso a <strong>{email}</strong>. Ábrelo desde este dispositivo o copia la URL y vuelve aquí.</p>
              ) : (
                <Button onClick={handleSendLink} disabled={status === 'sending'}>
                  {status === 'sending' ? 'Enviando…' : 'Enviar enlace de acceso'}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
