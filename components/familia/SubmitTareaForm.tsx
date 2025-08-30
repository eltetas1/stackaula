'use client';

import { useState } from 'react';
import { db } from '@/lib/firebaseClient';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  tareaId: string;
  familyId: string;  // id/doc de la familia logueada
  alumno: string;    // nombre del alumno
};

export default function SubmitTareaForm({ tareaId, familyId, alumno }: Props) {
  const [url, setUrl] = useState('');
  const [comentario, setComentario] = useState('');
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      alert('Pon el enlace de Drive (o similar).');
      return;
    }
    setSending(true);
    try {
      await addDoc(collection(db, 'entregas'), {
        tareaId,
        familyId,
        alumno,
        linkURL: url.trim(),
        comentario: comentario.trim() || null,
        createdAt: serverTimestamp(),
        status: 'enviada',
      });
      setUrl('');
      setComentario('');
      alert('¡Entrega enviada!');
    } catch (e) {
      console.error(e);
      alert('No se pudo enviar la entrega.');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="url">Enlace (Drive, etc.)</Label>
        <Input
          id="url"
          type="url"
          placeholder="https://drive.google.com/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="comentario">Comentario (opcional)</Label>
        <Textarea
          id="comentario"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Notas para el profesor…"
        />
      </div>

      <Button type="submit" disabled={sending}>
        {sending ? 'Enviando…' : 'Enviar tarea'}
      </Button>
    </form>
  );
}
