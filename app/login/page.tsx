// app/login/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthUser, loginEmail, completeMagicLinkIfPresent, loginPassword } from '@/hooks/useAuthUser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function LoginPage() {
  const router = useRouter();
  const { user, role, loading } = useAuthUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Completa el enlace mágico si se abre aquí
  useEffect(() => {
    (async () => {
      const completed = await completeMagicLinkIfPresent();
      if (completed) setInfo('Acceso verificado. Redirigiendo…');
    })();
  }, []);

  // Redirección por rol cuando ya hay sesión
  useEffect(() => {
    if (!loading && user) {
      if (role === 'teacher') router.replace('/maestro');
      else router.replace('/');
    }
  }, [user, role, loading, router]);

  const onSendMagic = async () => {
    setError(null); setInfo(null);
    try {
      setBusy(true);
      await loginEmail(email);
      setInfo(`Te enviamos un enlace a ${email}. Ábrelo para entrar.`);
    } catch (e: any) {
      setError(e?.message || 'No se pudo enviar el enlace');
    } finally {
      setBusy(false);
    }
  };

  const onLoginPassword = async () => {
    setError(null); setInfo(null);
    try {
      setBusy(true);
      await loginPassword(email, password);
      // la redirección la hace el efecto de arriba
    } catch (e: any) {
      setError(e?.message || 'No se pudo iniciar sesión');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Acceder al aula</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {info && <p className="text-sm text-green-700">{info}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="password">Correo y contraseña</TabsTrigger>
              <TabsTrigger value="magic">Enlace mágico</TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm">Correo</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="familia@ejemplo.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm">Contraseña</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <Button onClick={onLoginPassword} disabled={busy}>
                {busy ? 'Entrando…' : 'Entrar'}
              </Button>
            </TabsContent>

            <TabsContent value="magic" className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm">Correo</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="familia@ejemplo.com" />
              </div>
              <Button onClick={onSendMagic} disabled={busy}>
                {busy ? 'Enviando…' : 'Enviar enlace de acceso'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Recibirás un correo con un enlace. Ábrelo en este dispositivo para completar el acceso.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
