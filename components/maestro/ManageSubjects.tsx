'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { SubjectBadge } from '@/components/subjects/SubjectBadge';
import * as Icons from 'lucide-react';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { Palette, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import type { Subject } from '@/types/subjects';

// Paleta de colores (tailwind classes)
const AVAILABLE_COLORS = [
  { name: 'Azul', value: 'bg-blue-500' },
  { name: 'Verde', value: 'bg-green-500' },
  { name: 'Púrpura', value: 'bg-purple-500' },
  { name: 'Naranja', value: 'bg-orange-500' },
  { name: 'Rojo', value: 'bg-red-500' },
  { name: 'Rosa', value: 'bg-pink-500' },
  { name: 'Índigo', value: 'bg-indigo-500' },
  { name: 'Amarillo', value: 'bg-yellow-500' },
  { name: 'Teal', value: 'bg-teal-500' },
  { name: 'Cyan', value: 'bg-cyan-500' },
] as const;

const AVAILABLE_ICONS = [
  'Calculator', 'BookOpen', 'Microscope', 'Globe', 'Zap', 'Palette',
  'Languages', 'Music', 'Camera', 'Gamepad2', 'Heart', 'Star',
] as const;

export default function ManageSubjects() {
  const { toast } = useToast();

  // Lista en tiempo real
  const [list, setList] = useState<Subject[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Crear
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newIcon, setNewIcon] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Editar inline
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const isEditing = (id: string) => editId === id;

  // ==== Suscripción Firestore (normaliza createdAt -> Date) ====
  useEffect(() => {
    const q = query(collection(db, 'subjects'), orderBy('name'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: Subject[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name,
            color: data.color,
            icon: data.icon,
            description: data.description ?? '',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          };
        });
        setList(rows);
        setLoadingList(false);
      },
      (err) => {
        console.error(err);
        setLoadingList(false);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las asignaturas.',
          variant: 'destructive',
        });
      }
    );

    return () => unsub();
  }, [toast]);

  // ==== Crear asignatura ====
  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newColor || !newIcon) {
      toast({
        title: 'Faltan datos',
        description: 'Nombre, color e icono son obligatorios.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setCreating(true);
      await addDoc(collection(db, 'subjects'), {
        name: newName.trim(),
        color: newColor,
        icon: newIcon,
        description: newDescription.trim() || undefined,
        createdAt: Timestamp.now(),
      });
      setNewName('');
      setNewColor('');
      setNewIcon('');
      setNewDescription('');
      toast({ title: '¡Asignatura creada!' });
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Error',
        description: e?.message ?? 'No se pudo crear.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  }

  // ==== Editar inline ====
  function startEdit(row: Subject) {
    setEditId(row.id);
    setEditName(row.name);
    setEditColor(row.color);
    setEditIcon(row.icon);
    setEditDescription(row.description ?? '');
  }

  function cancelEdit() {
    setEditId(null);
    setEditName('');
    setEditColor('');
    setEditIcon('');
    setEditDescription('');
  }

  async function saveEdit() {
    if (!editId) return;
    if (!editName.trim() || !editColor || !editIcon) {
      toast({
        title: 'Faltan datos',
        description: 'Nombre, color e icono son obligatorios.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await updateDoc(doc(db, 'subjects', editId), {
        name: editName.trim(),
        color: editColor,
        icon: editIcon,
        description: editDescription.trim() || undefined,
      });
      toast({ title: 'Cambios guardados' });
      cancelEdit();
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Error',
        description: e?.message ?? 'No se pudo guardar.',
        variant: 'destructive',
      });
    }
  }

  // ==== Borrar ====
  async function remove(id: string) {
    if (!confirm('¿Eliminar esta asignatura?')) return;
    try {
      await deleteDoc(doc(db, 'subjects', id));
      toast({ title: 'Asignatura eliminada' });
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Error',
        description: e?.message ?? 'No se pudo eliminar.',
        variant: 'destructive',
      });
    }
  }

  const IconPreview = useMemo(() => {
    if (!newIcon) return null;
    const Comp = Icons[newIcon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
    return Comp ? <Comp className="h-4 w-4" /> : null;
  }, [newIcon]);

  return (
    <div className="space-y-8">
      {/* LISTA / EDICIÓN */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Asignaturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <p className="text-gray-500">No hay asignaturas. Crea una abajo.</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map((s) => {
                const IconComp = Icons[s.icon as keyof typeof Icons] as any;
                return (
                  <li key={s.id} className="p-4 border rounded-lg space-y-3">
                    {isEditing(s.id) ? (
                      <>
                        <div className="grid gap-2">
                          <Label>Nombre</Label>
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                        </div>

                        <div className="grid gap-2">
                          <Label>Color</Label>
                          <Select value={editColor} onValueChange={setEditColor}>
                            <SelectTrigger><SelectValue placeholder="Color" /></SelectTrigger>
                            <SelectContent>
                              {AVAILABLE_COLORS.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                  <div className="flex items-center gap-2">
                                    <span className={`w-4 h-4 rounded-full ${c.value}`} />
                                    {c.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label>Icono</Label>
                          <Select value={editIcon} onValueChange={setEditIcon}>
                            <SelectTrigger><SelectValue placeholder="Icono" /></SelectTrigger>
                            <SelectContent>
                              {AVAILABLE_ICONS.map((n) => {
                                const C = Icons[n as keyof typeof Icons] as any;
                                return (
                                  <SelectItem key={n} value={n}>
                                    <div className="flex items-center gap-2">
                                      <C className="h-4 w-4" />
                                      {n}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label>Descripción</Label>
                          <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={saveEdit} className="bg-emerald-600 hover:bg-emerald-700">
                            <Check className="h-4 w-4 mr-1" /> Guardar
                          </Button>
                          <Button variant="outline" onClick={cancelEdit}>
                            <X className="h-4 w-4 mr-1" /> Cancelar
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <SubjectBadge subject={s} size="md" />
                        {s.description && <p className="text-sm text-gray-600">{s.description}</p>}

                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => startEdit(s)}>
                            <Pencil className="h-4 w-4 mr-1" /> Editar
                          </Button>
                          <Button variant="destructive" onClick={() => remove(s.id)}>
                            <Trash2 className="h-4 w-4 mr-1" /> Borrar
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* CREAR NUEVA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Crear nueva asignatura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Nombre *</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>

              <div className="grid gap-2">
                <Label>Color *</Label>
                <Select value={newColor} onValueChange={setNewColor} required>
                  <SelectTrigger><SelectValue placeholder="Selecciona color" /></SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_COLORS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <span className={`w-4 h-4 rounded-full ${c.value}`} />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Icono *</Label>
              <Select value={newIcon} onValueChange={setNewIcon} required>
                <SelectTrigger><SelectValue placeholder="Selecciona icono" /></SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ICONS.map((n) => {
                    const C = Icons[n as keyof typeof Icons] as any;
                    return (
                      <SelectItem key={n} value={n}>
                        <div className="flex items-center gap-2">
                          <C className="h-4 w-4" />
                          {n}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Descripción (opcional)</Label>
              <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
            </div>

            {/* Preview simple */}
            {newName && newColor && newIcon && (
              <div className="p-3 bg-gray-50 rounded">
                <Label>Vista previa</Label>
                <div className="mt-2">
                  <SubjectBadge
                    subject={{
                      id: 'preview',
                      name: newName,
                      color: newColor,
                      icon: newIcon,
                      description: newDescription,
                      createdAt: new Date(),
                    }}
                  />
                </div>
              </div>
            )}

            <Button type="submit" disabled={creating} className="bg-blue-600 hover:bg-blue-700">
              {creating ? 'Creando…' : 'Crear asignatura'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
