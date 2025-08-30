'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AvisoList } from '@/components/avisos/AvisoList';
import { AvisoSkeletonList } from '@/components/avisos/AvisoSkeleton';
import { ErrorState } from '@/components/avisos/ErrorState';
import { useAvisos } from '@/hooks/useAvisos';
import { useSubjects } from '@/hooks/useSubjects';
import { RefreshCw, ClipboardList } from 'lucide-react';

export default function TareasPage() {
  const { avisos: allTareas, loading, error, hasNext, loadMore, refresh } = useAvisos({ 
    limit: 12, 
    type: 'tarea' 
  });
  const { subjects } = useSubjects();
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Filter by subject on client side for simplicity in MVP
  const filteredTareas = selectedSubject === 'all' 
    ? allTareas 
    : allTareas.filter(tarea => tarea.subjectId === selectedSubject);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    loadMore();
    setTimeout(() => setLoadingMore(false), 500);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-100 rounded-full">
            <ClipboardList className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Todas las Tareas
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Consulta todas las tareas asignadas por asignatura
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

      {/* Subject Filter Tabs */}
      <Tabs value={selectedSubject} onValueChange={setSelectedSubject} className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 w-full max-w-4xl">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              Todas
            </TabsTrigger>
            {subjects.slice(0, 7).map((subject) => (
              <TabsTrigger 
                key={subject.id} 
                value={subject.id}
                className="text-xs sm:text-sm"
              >
                {subject.name.split(' ')[0]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={selectedSubject}>
          {/* Content */}
          {loading && <AvisoSkeletonList count={12} />}
          
          {error && (
            <ErrorState message={error} onRetry={refresh} />
          )}
          
          {!loading && !error && (
            <div className="space-y-8">
              <AvisoList avisos={filteredTareas} />
              
              {/* Load More - only show if not filtering by subject */}
              {hasNext && selectedSubject === 'all' && (
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
                      'Cargar más tareas'
                    )}
                  </Button>
                </div>
              )}
              
              {/* End Message */}
              {!hasNext && filteredTareas.length > 0 && selectedSubject === 'all' && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">
                    Has visto todas las tareas disponibles
                  </p>
                </div>
              )}

              {/* No results for filter */}
              {filteredTareas.length === 0 && selectedSubject !== 'all' && !loading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <ClipboardList className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay tareas para esta asignatura
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Las tareas aparecerán aquí cuando estén disponibles.
                  </p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}