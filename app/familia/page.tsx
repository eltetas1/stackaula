'use client';

import { useRouter } from 'next/navigation';
import { useAuthClaims } from '@/hooks/useAuthClaims';
import { useAvisos } from '@/hooks/useAvisos';

export default function FamiliaPage() {
  const { user, claims, loading } = useAuthClaims();
  const { avisos, loading: loadingAvisos, error, hasNext, loadMore } = useAvisos({ limit: 10 });
  const router = useRouter();

  if (loading) return <div className="p-6">Comprobando sesión…</div>;
  if (!user) { router.push('/login'); return null; }
  if (claims?.role !== 'family') { router.push('/'); return null; }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Panel de la Familia</h1>

      {loadingAvisos && <p>Cargando avisos…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loadingAvisos && avisos.length === 0 && <p>No hay avisos aún.</p>}

      <div className="space-y-4">
        {avisos.map(a => (
          <article key={a.id} className="border rounded-2xl p-4">
            <h2 className="text-lg font-semibold">{a.title}</h2>
            <p className="mt-1 whitespace-pre-line">{a.body}</p>
            {a.createdAt?.toDate && (
              <p className="text-xs text-gray-500 mt-2">
                {a.createdAt.toDate().toLocaleString()}
              </p>
            )}
          </article>
        ))}
      </div>

      {!loadingAvisos && hasNext && (
        <button className="border px-3 py-2 rounded mt-2" onClick={loadMore}>
          Ver más
        </button>
      )}
    </div>
  );
}
