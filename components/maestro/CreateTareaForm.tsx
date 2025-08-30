'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSubjects } from '@/hooks/useSubjects';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { ClipboardList, Send, Calendar } from 'lucide-react';

// 👇 NUEVO: prop opcional que avisará al padre para refrescar / volver al dashboard
type CreateTareaFormProps = {
  onCreated?: () => void;
};

export function CreateTareaForm({ onCreated }: CreateTareaFormProps) {
  const { toast } = useToast();
  const { subjects, loading: loadingSubjects } = useSubjects();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState(''); // usamos 'body' para las tareas
  const [subjectId, setSubjectId] = useState('');
  const [dueDate, setDueDate] = useState(''); // datetime-local
  const [published, setPublished] = useState(true);

  // opcional: mismo modelado de alcance que los avisos (por si lo quieres usar)
  const [scope, setScope] = useState<'all' | 'family' | 'student'>('all');
  const [familyId, setFamilyId] = useState('');
  const [studentId, setStudentId] = useState('');

  const [loading, setLoading] = useState(false);

  const selectedSubject = subjects.find((s) => s.id === subjectId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !body.trim() || !subjectId) {
      toast({
        title: 'Faltan datos',
        description: 'Completa título, descripción y asignatura.',
        variant: 'destructive',
      });
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      toast({
        title: 'Sesión requerida',
        description: 'Inicia sesión como profesor.',
        variant: 'destructive',
      });
      return;
    }

    // comprueba el rol = teacher (coincide con las reglas)
    const userSnap = await getDoc(doc(db, 'users', uid));
    const role = userSnap.exists() ? (userSnap.data() as any).role : null;
    if (role !== 'teacher') {
      toast({
        title: 'Sin permisos',
        description: 'Tu usuario no es profesor.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const payload: any = {
        title: title.trim(),
        body: body.trim(),
        type: 'tarea',
        subjectId,
        published,
        createdAt: Timestamp.now(),
        createdBy: uid,
      };

      if (dueDate) {
        payload.dueDate = Timestamp.fromDate(new Date(dueDate));
      }

      // si quieres guardar el alcance igual que con avisos:
      payload.target =
        scope === 'all'
          ? { scope: 'all' }
          : scope === 'family'
          ? { scope: 'family', familyId }
          : { scope: 'student', studentId };

      await addDoc(collection(db, 'avisos'), payload);

      toast({ title: '¡Éxito!', description: 'La tarea se creó correctamente.' });

      // reset
      setTitle('');
      setBody('');
      setSubjectId('');
      setDueDate('');
      setPublished(true);
      setScope('all');
      setFamilyId('');
      setStudentId('');

      // 👇 avisa al padre (page.tsx) para refrescar y volver al dashboard
      onCreated?.();
    } catch (error: any) {
      console.error('Error creating tarea:', error);
      toast({
        title: 'Error al crear',
        description: error?.message ?? 'No se pudo crear la tarea.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Crear Nueva Tarea
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título de la tarea..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Asignatura *</Label>
              <Select value={subjectId} onValueChange={setSubjectId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una asignatura" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSubject && (
                <p className="text-xs text-gray-500 mt-1">Seleccionada: {selectedSubject.name}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Fecha de entrega (opcional)</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Descripción de la tarea *</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe la tarea, instrucciones, materiales necesarios..."
              rows={8}
              required
            />
          </div>

          {/* Alcance (opcional) */}
          <div className="space-y-2">
            <Label>Alcance</Label>
            <select
              className="border p-2 rounded w-full"
              value={scope}
              onChange={(e) => setScope(e.target.value as any)}
            >
              <option value="all">Todos</option>
              <option value="family">Una familia</option>
              <option value="student">Un alumno</option>
            </select>
          </div>

          {scope === 'family' && (
            <div className="space-y-2">
              <Label htmlFor="familyId">ID de familia</Label>
              <Input
                id="familyId"
                value={familyId}
                onChange={(e) => setFamilyId(e.target.value)}
                placeholder="p.ej. garcia"
                required
              />
            </div>
          )}

          {scope === 'student' && (
            <div className="space-y-2">
              <Label htmlFor="studentId">ID de alumno</Label>
              <Input
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="p.ej. alumno1"
                required
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch id="published" checked={published} onCheckedChange={setPublished} />
            <Label htmlFor="published">Publicar inmediatamente</Label>
          </div>

          <Button
            type="submit"
            disabled={loading || loadingSubjects}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Crear Tarea
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
