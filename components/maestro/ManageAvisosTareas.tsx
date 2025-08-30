'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Card, CardHeader, CardContent, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useToast } from '@/hooks/use-toast';
import { useAvisos } from '@/hooks/useAvisos';
import { useSubjects } from '@/hooks/useSubjects';
import { db } from '@/lib/firebase';
import {
  Timestamp, doc, deleteDoc, updateDoc,
} from 'firebase/firestore';
import {
  Filter, MoreVertical, Edit2, Trash2, Eye, EyeOff, ClipboardList, BookOpen,
} from 'lucide-react';

type TypeFilter = 'all' | 'aviso' | 'tarea';

type Item = {
  id: string;
  type: 'aviso' | 'tarea';
  title: string;
  body?: string;      // para tareas
  content?: string;   // para avisos
  subjectId?: string | null;
  published?: boolean;
  createdAt?: any;
  dueDate?: any;      // tareas
};

export function ManageAvisosTareas() {
  const [filter, setFilter] = useState<TypeFilter>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Item | null>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [toDelete, setToDelete] = useState<Item | null>(null);
  const [openDelete, setOpenDelete] = useState(false);

  // para lista
  const { avisos, loading, error, refresh } = useAvisos({
    limit: 50,
    type: filter, // si tu hook respeta type, ya filtra en servidor.
  });

  // por si tu hook aún no aplica el filtro, lo reforzamos en cliente
  const items = useMemo(() => {
    const base = filter === 'all' ? avisos : avisos.filter((a: any) => a.type === filter);
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter((a: any) =>
      a.title?.toLowerCase().includes(q) ||
      a.body?.toLowerCase().includes(q) ||
      a.content?.toLowerCase().includes(q));
  }, [avisos, filter, search]);

  // subjects para edición de tareas
  const { subjects } = useSubjects();
  const { toast } = useToast();

  // ---- acciones -------------------------------------------------------------

  const togglePublished = async (item: Item) => {
    try {
      await updateDoc(doc(db, 'avisos', item.id), { published: !item.published });
      toast({ title: 'Hecho', description: item.published ? 'Ocultado' : 'Publicado' });
      refresh();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'No se pudo actualizar.', variant: 'destructive' });
    }
  };

  const askDelete = (item: Item) => {
    setToDelete(item);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteDoc(doc(db, 'avisos', toDelete.id));
      toast({ title: 'Borrado', description: 'El elemento ha sido eliminado.' });
      setOpenDelete(false);
      setToDelete(null);
      refresh();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'No se pudo eliminar.', variant: 'destructive' });
    }
  };

  const openEditDialog = (item: Item) => {
    setEditing({
      ...item,
      body: item.body ?? item.content ?? '',
      content: undefined, // normalizamos a body en el formulario
      subjectId: item.subjectId ?? '',
      dueDate: item.dueDate
        ? (item.dueDate.toDate ? item.dueDate.toDate() : new Date(item.dueDate))
        : '',
    });
    setOpenEdit(true);
  };

  const saveEdit = async () => {
    if (!editing) return;

    const payload: any = {
      title: editing.title?.trim() ?? '',
      published: !!editing.published,
      // Para avisos usaremos "content"; para tareas usaremos "body"
      ...(editing.type === 'tarea'
        ? { body: editing.body?.trim() ?? '' }
        : { content: editing.body?.trim() ?? '' }),
    };

    if (editing.type === 'tarea') {
      payload.subjectId = editing.subjectId || null;
      payload.dueDate = editing.dueDate
        ? Timestamp.fromDate(new Date(editing.dueDate))
        : null;
    }

    try {
      await updateDoc(doc(db, 'avisos', editing.id), payload);
      toast({ title: 'Guardado', description: 'Los cambios se han aplicado.' });
      setOpenEdit(false);
      setEditing(null);
      refresh();
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'No se pudo guardar.', variant: 'destructive' });
    }
  };

  // ---- UI -------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Gestionar avisos y tareas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as TypeFilter)}>
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="aviso">Avisos</TabsTrigger>
                <TabsTrigger value="tarea">Tareas</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex-1" />

            <Input
              placeholder="Buscar por título o texto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-80"
            />
            <Button variant="outline" onClick={refresh}>Actualizar</Button>
          </div>

          {/* Lista */}
          {loading && <p className="text-sm text-gray-500">Cargando…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && items.length === 0 && (
            <p className="text-sm text-gray-500">No hay elementos.</p>
          )}

          <div className="divide-y rounded-md border">
            {items.map((it: Item) => (
              <div key={it.id} className="flex items-center gap-3 p-3">
                <div className="flex items-center gap-2 w-40 shrink-0 text-gray-600">
                  {it.type === 'tarea' ? (
                    <>
                      <ClipboardList className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        Tarea
                      </span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                        Aviso
                      </span>
                    </>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{it.title}</div>
                  {it.type === 'tarea' && it.dueDate && (
                    <div className="text-xs text-gray-500">
                      Entrega:{' '}
                      {it.dueDate?.toDate
                        ? it.dueDate.toDate().toLocaleString()
                        : new Date(it.dueDate).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePublished(it)}
                    title={it.published ? 'Ocultar' : 'Publicar'}
                  >
                    {it.published ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-1" /> Ocultar
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-1" /> Publicar
                      </>
                    )}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(it)}>
                        <Edit2 className="h-4 w-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => askDelete(it)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialogo editar */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing?.type === 'tarea' ? 'Editar tarea' : 'Editar aviso'}
            </DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </div>

              {editing.type === 'tarea' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Asignatura</Label>
                      <select
                        value={editing.subjectId ?? ''}
                        onChange={(e) =>
                          setEditing({ ...editing, subjectId: e.target.value })
                        }
                        className="w-full h-10 rounded-md border px-3 text-sm"
                      >
                        <option value="">— Sin asignatura —</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de entrega</Label>
                      <Input
                        type="datetime-local"
                        value={
                          editing.dueDate
                            ? new Date(editing.dueDate).toISOString().slice(0, 16)
                            : ''
                        }
                        onChange={(e) =>
                          setEditing({ ...editing, dueDate: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>{editing.type === 'tarea' ? 'Descripción' : 'Contenido'}</Label>
                <Textarea
                  rows={8}
                  value={editing.body ?? ''}
                  onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="published"
                  checked={!!editing.published}
                  onCheckedChange={(v) => setEditing({ ...editing, published: v })}
                />
                <Label htmlFor="published">Publicado</Label>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenEdit(false)}>
              Cancelar
            </Button>
            <Button onClick={saveEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar borrado */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar definitivamente?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-gray-600">
            Esta acción no se puede deshacer.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
