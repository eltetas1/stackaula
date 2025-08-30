'use client';
import { useState } from 'react';

export default function CreateAvisoForm() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setOk(null); setErr(null);
    try {
      const res = await fetch('/api/avisos/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-admin-secret': process.env.NEXT_PUBLIC_DEV_ADMIN_SECRET || '',
        },
        body: JSON.stringify({ title, body, visible: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setOk('Aviso publicado');
      setTitle(''); setBody('');
    } catch (e:any) {
      setErr(e.message);
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input className="border p-2 w-full" placeholder="Título" value={title} onChange={e=>setTitle(e.target.value)} />
      <textarea className="border p-2 w-full" placeholder="Contenido" rows={4} value={body} onChange={e=>setBody(e.target.value)} />
      <button className="border px-3 py-2" disabled={loading}>{loading ? 'Publicando…' : 'Publicar aviso'}</button>
      {ok && <span className="text-green-600 text-sm">{ok}</span>}
      {err && <span className="text-red-600 text-sm">{err}</span>}
    </form>
  );
}
