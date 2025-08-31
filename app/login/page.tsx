// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Role = 'admin' | 'teacher' | 'family' | 'student' | 'none';

function mapAuthError(code: string) {
  switch (code) {
    case 'auth/invalid-email': return 'Email no válido';
    case 'auth/user-disabled': return 'Usuario deshabilitado';
    case 'auth/user-not-found': return 'No existe un usuario con ese email';
    case 'auth/wrong-password': return 'Contraseña incorrecta';
    case 'auth/too-many-requests': return 'Demasiados intentos. Inténtalo más tarde';
    case 'auth/network-request-failed': return 'Error de red. Revisa tu conexión';
    default: return 'No se pudo iniciar sesión. Revisa email/contraseña';
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      // Lee el rol desde /users/{uid}
      let role: Role = 'none';
      try {
        const uref = doc(db, 'users', cred.user.uid);
        const usnap = await getDoc(uref);
        const r = (usnap.exists() ? (usnap.data() as any).role : null) as Role | null;
        role = (r as Role) || 'none';
      } catch {
        role = 'none';
      }

      // Redirecciones por rol
      if (role === 'teacher' || role === 'admin') {
        router.replace('/maestro');
      } else if (role === 'family') {
        router.replace('/familia/entregas');
      } else {
        // sin rol: llévalo al inicio o a perfil
        router.replace('/');
      }
    } catch (e: any) {
      setErr(mapAuthError(e?.code || ''));
    } finally {
      setBusy(false);
    }
  };

  const resetPass = async () => {
    setErr(null);
    setMsg(null);
    if (!email.trim()) {
      setErr('Escribe tu email y luego pulsa “Recuperar contraseña”.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMsg('Te hemos enviado un correo para restablecer la contraseña.');
    } catch (e: any) {
      setErr(mapAuthError(e?.code || ''));
    }
  };

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pass">Contraseña</Label>
                <Input
                  id="pass"
                  type="password"
                  autoComplete="current-password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                />
              </div>

              {err && <p className="text-sm text-red-600">{err}</p>}
              {msg && <p className="text-sm text-emerald-600">{msg}</p>}

              <div className="flex items-center justify-between gap-2">
                <Button type="submit" disabled={busy}>
                  {busy ? 'Entrando…' : 'Entrar'}
                </Button>
                <Button type="button" variant="link" onClick={resetPass} disabled={busy}>
                  Recuperar contraseña
                </Button>
              </div>
            </form>

            <div className="mt-6 text-sm text-muted-foreground">
              ¿No tienes cuenta? Pide acceso al centro educativo.
            </div>

            <div className="mt-6">
              <Button asChild variant="outline">
                <Link href="/">Volver al inicio</Link>
              </Button>
            </div>

            {/* Diagnóstico de config (solo visible en consola) */}
            <details className="mt-6">
              <summary className="cursor-pointer text-sm">Ayuda / diagnóstico</summary>
              <pre className="text-xs mt-2 whitespace-pre-wrap">
                {`projectId=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '(no definido)'}
authDomain=${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '(no definido)'}
apiKey=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'OK' : '(no definido)'}
appId=${process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? 'OK' : '(no definido)'}
`}
              </pre>
              <p className="text-xs text-muted-foreground">
                Si ves “(no definido)” en producción, revisa variables de entorno en Netlify y vuelve a desplegar.
              </p>
            </details>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
