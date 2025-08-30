'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AvisoList } from '@/components/avisos/AvisoList';
import { AvisoSkeletonList } from '@/components/avisos/AvisoSkeleton';
import { ErrorState } from '@/components/avisos/ErrorState';
import { useAvisos } from '@/hooks/useAvisos';
import { RefreshCw, FileText } from 'lucide-react';

export default function AvisosPage() {
  // 👇 Pedimos SOLO avisos (no tareas)
  const { avisos, loading, error, hasNext, loadMore, refresh } = useAvisos({
    limit: 12,
    type: 'aviso',
  });

  // Filtro extra por si tu hook aún no aplica el "type"
  const onlyAvisos = avisos.filter((a: any) => a.type === 'aviso');

  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await loadMore();
    setLoadingMore(false);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-100 rounded-full">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Todos los Avisos
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Consulta todas las comunicaciones y avisos del centro educativo
        </p>

        {!loading && !error && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading && <AvisoSkeletonList count={12} />}

      {error && <ErrorState message={error} onRetry={refresh} />}

      {!loading && !error && (
        <div className="space-y-8">
          {/* 👇 Solo avisos */}
          <AvisoList avisos={onlyAvisos} />

          {/* Load More */}
          {hasNext && (
            <div className="flex justify-center">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loadingMore ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  'Cargar más avisos'
                )}
              </Button>
            </div>
          )}

          {/* End Message */}
          {!hasNext && onlyAvisos.length > 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">
                Has visto todos los avisos disponibles
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
