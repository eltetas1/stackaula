'use client';

import { useFamilyFeed } from '@/hooks/useFamilyFeed';

export default function FamilyPage() {
  const { items, loading } = useFamilyFeed();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold mb-6">Panel de la Familia</h1>

      {loading ? (
        <p>Cargando avisos...</p>
      ) : items.length === 0 ? (
        <p>No hay avisos disponibles.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((aviso) => (
            <li key={aviso.id} className="p-4 border rounded-lg shadow-sm">
              <h2 className="font-semibold text-lg">{aviso.title}</h2>
              <p className="text-gray-700">{aviso.content}</p>
              <p className="text-sm text-gray-500">
                {new Date(aviso.createdAtMs).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
