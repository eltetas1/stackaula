// app/debug/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuthUser } from '@/hooks/useAuthUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DebugPage() {
  const { user, role, familyId, loading } = useAuthUser();
  const [copied, setCopied] = useState(false);

  const cfg = {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST,
    NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST: process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST,
  };

  const info = {
    loading,
    uid: user?.uid ?? null,
    email: user?.email ?? null,
    role: role ?? null,
    familyId: familyId ?? null,
  };

  const text = JSON.stringify({ cfg, info }, null, 2);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto max-w-2xl p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Debug entorno</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <pre className="text-xs bg-muted p-3 rounded overflow-auto">{text}</pre>
          <Button onClick={copy}>{copied ? 'Copiado' : 'Copiar'}</Button>
          <p className="text-sm text-muted-foreground">
            Revisa que <strong>NEXT_PUBLIC_FIREBASE_PROJECT_ID</strong> sea <code>aula-ceip-7fa63</code> en producción.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
