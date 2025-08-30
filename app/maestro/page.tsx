'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthUser, logout } from '@/hooks/useAuthUser';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAvisos } from '@/hooks/useAvisos';
import { useSubjects } from '@/hooks/useSubjects';
import { AvisoSkeletonList } from '@/components/avisos/AvisoSkeleton';
import { ErrorState } from '@/components/avisos/ErrorState';
import { CreateAvisoForm } from '@/components/maestro/CreateAvisoForm';
import { CreateTareaForm } from '@/components/maestro/CreateTareaForm';
import ManageSubjects from '@/components/maestro/ManageSubjects';
import { ManageAvisosTareas } from '@/components/maestro/ManageAvisosTareas';

import {
  Settings,
  BookOpen,
  ClipboardList,
  Palette,
  BarChart3,
  Users,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function MaestroPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
const { avisos: allAvisos, loading: loadingAvisos, refresh: refreshAll } =
  useAvisos({ limit: 5, type: 'all' });

const { avisos: recentTareas, loading: loadingTareas, refresh: refreshTareas } =
  useAvisos({ limit: 5, type: 'tarea' });

  const { subjects, loading: loadingSubjects } = useSubjects();

  const router = useRouter();
  const { user, userDoc, loading } = useAuthUser();

  // Redirige si no está logueado o no es teacher
  useEffect(() => {
    if (!loading) {
      if (!user) router.replace('/login');
      else if (userDoc?.role !== 'teacher') router.replace('/');
    }
  }, [user, userDoc, loading, router]);

  if (loading || !user || userDoc?.role !== 'teacher') {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold">Comprobando permisos…</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-4 bg-blue-100 rounded-full">
              <Settings className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel del Maestro</h1>
              <p className="text-lg text-gray-600">
                Gestiona avisos, tareas y asignaturas del aula
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={logout}>
            Salir
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* ⬇️ he pasado a 6 columnas para que quepa el nuevo tab */}
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-6 mb-8">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>

          <TabsTrigger value="create-aviso" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Crear Aviso</span>
          </TabsTrigger>

          <TabsTrigger value="create-tarea" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Crear Tarea</span>
          </TabsTrigger>

          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Asignaturas</span>
          </TabsTrigger>

          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Alumnos</span>
          </TabsTrigger>

          {/* ⬇️ NUEVO TAB: Gestionar */}
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Gestionar</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Avisos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loadingAvisos ? '...' : allAvisos.filter((a) => a.type === 'aviso').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Tareas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loadingTareas ? '...' : recentTareas.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Asignaturas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loadingSubjects ? '...' : subjects.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actividad reciente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAvisos ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : allAvisos.length > 0 ? (
                <div className="space-y-3">
                  {allAvisos.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {item.type === 'tarea' ? (
                        <ClipboardList className="h-4 w-4 text-blue-600" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-green-600" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.title}</p>
                        {item.subject && (
                          <p className="text-sm text-gray-600">{item.subject.name}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.type === 'tarea' ? 'Tarea' : 'Aviso'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No hay actividad reciente</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crear Aviso */}
<TabsContent value="create-aviso">
  <CreateAvisoForm
    onCreated={() => {
      refreshAll();        // refresca lista de avisos/tareas del dashboard
      refreshTareas();
      setActiveTab('dashboard'); // vuelve al tab principal
    }}
  />
</TabsContent>

        {/* Crear Tarea */}
<TabsContent value="create-tarea">
  <CreateTareaForm
    onCreated={() => {
      refreshAll();
      refreshTareas();
      setActiveTab('dashboard');
    }}
  />
</TabsContent>

        {/* Asignaturas */}
        <TabsContent value="subjects">
          <ManageSubjects />
        </TabsContent>

        {/* Alumnos (placeholder) */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestión de Alumnos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Próximamente</h3>
                <p className="text-gray-600">
                  La gestión de alumnos estará disponible en una futura actualización.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ⬇️ NUEVO: Gestión de Avisos y Tareas */}
        <TabsContent value="manage">
          <ManageAvisosTareas />
        </TabsContent>
      </Tabs>
    </div>
  );
}
