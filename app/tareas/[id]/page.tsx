'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function EntregarTareaPage() {
  const { tareaId } = useParams<{ tareaId: string }>();

  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [linkURL, setLinkURL] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);

    if (!nombre.trim() || !apellidos.trim()) {
      setError('Escribe nombre y apellidos.');
      return;
    }
    if (!/^https?:\/\//i.test(linkURL.trim())) {
      setError('Pon un enlace válido (http/https).');
      return;
    }

    try {
      setEnviando(true);
      const res = await fetch('/api/entregas-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tareaId: String(tareaId),
          nombre: nombre.trim(),
          apellidos: apellidos.trim(),
          linkURL: linkURL.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo enviar');
      setOk(true);
      setNombre('');
      setApellidos('');
      setLinkURL('');
    } catch (err: any) {
      setError(err.message || 'Error enviando la entrega.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Entregar tarea</h1>
        <p className="text-sm text-muted-foreground">
          Tarea: <b>{String(tareaId)}</b>
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              className="w-full border rounded p-2"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del alumno/a"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Apellidos</label>
            <input
              className="w-full border rounded p-2"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              placeholder="Apellidos"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Enlace de la entrega</label>
          <input
            className="w-full border rounded p-2"
            placeholder="https://drive.google.com/..."
            value={linkURL}
            onChange={(e) => setLinkURL(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Pon aquí el enlace al archivo (Drive, vídeo, etc.).
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {ok && <p className="text-sm text-emerald-600">¡Entrega enviada correctamente!</p>}

        <Button type="submit" disabled={enviando} className="w-full">
          {enviando ? 'Enviando…' : 'Enviar entrega'}
        </Button>
      </form>
    </div>
  );
}
