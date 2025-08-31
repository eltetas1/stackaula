// components/familia/SubmitTareaForm.tsx
'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthUser } from '@/hooks/useAuthUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
  tareaId: string;
  onCreated?: (entregaId: string) => void;
};

export default function SubmitTareaForm({ tareaId, onCreated }: Props) {
  const { user } = useAuthUser();
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(null);

    if (!user) {
      setErr('Debes iniciar sesión para entregar.');
      return;
    }
    if (!link.trim()) {
      setErr('Añade el enlace de la entrega.');
      return;
    }

    try {
      setBusy(true);

      const docRef = await addDoc(collection(db, 'entregas'), {
        tareaId,
        userId: user.uid,                 // 🔑 requerido por las reglas
        familyEmail: user.email ?? null,  // para notificaciones
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        url: link.trim(),
        status: 'pendiente',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setOk('Entrega enviada.');
      setNombre('');
      setApellidos('');
      setLink('');
      onCreated?.(docRef.id);
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg.includes('Missing or insufficient permissions')) {
        setErr('Permisos insuficientes: inicia sesión con la familia correcta.');
      } else {
        setErr('No se pudo enviar la entrega.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Nombre</label>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div>
          <label className="text-sm">Apellidos</label>
          <Input value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-sm">Enlace de la entrega</label>
        <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}
      {ok && <p className="text-sm text-green-700">{ok}</p>}

      <Button type="submit" disabled={busy}>
        {busy ? 'Enviando…' : 'Enviar entrega'}
      </Button>
    </form>
  );
}
