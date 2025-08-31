'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useAuthUser } from '@/hooks/useAuthUser';

type Props = {
  tareaId: string; // id de la tarea a la que se entrega
};

export default function SubmitTareaForm({ tareaId }: Props) {
  const { user, loading } = useAuthUser();
  const [linkURL, setLinkURL] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const canCreate =
    !loading &&
    !!user &&
    user.role === 'family' &&
    !!user.familyId &&
    !!tareaId;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);

    if (!canCreate) {
      setError('Debes iniciar sesión como familia para entregar esta tarea.');
      return;
    }

    // validación sencilla del enlace
    if (!/^https?:\/\//i.test(linkURL.trim())) {
      setError('Introduce un enlace válido (http/https).');
      return;
    }

    try {
      setSending(true);
      await addDoc(collection(db, 'entregas'), {
        tareaId,
        familyId: user!.familyId,       // 🔒 se toma del /users, no del input
        linkURL: linkURL.trim(),
        createdAt: serverTimestamp(),
      });
      setOk(true);
      setLinkURL('');
    } catch (err: any) {
      console.error('Error creando entrega:', err);
      // Muestra un mensaje claro si chocan las reglas
      setError('No se pudo registrar la entrega. ¿Tienes permisos y sesión iniciada?');
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium">Enlace (Drive, vídeo, etc.)</label>
        <input
          className="w-full border rounded p-2"
          placeholder="https://..."
          value={linkURL}
          onChange={(e) => setLinkURL(e.target.value)}
        />
      </div>

      {!canCreate && !loading && (
        <p className="text-sm text-amber-600">
          Inicia sesión como <b>familia</b> para poder entregar.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {ok && <p className="text-sm text-emerald-600">¡Entrega enviada!</p>}

      <button
        type="submit"
        disabled={!canCreate || sending}
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
      >
        {sending ? 'Enviando…' : 'Entregar'}
      </button>
    </form>
  );
}
