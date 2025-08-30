'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase'; // reexporta firebaseClient
import { BookOpen, Send } from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { getIdTokenResult } from 'firebase/auth';

type CreateAvisoFormProps = { onCreated?: () => void };

export function CreateAvisoForm({ onCreated }: CreateAvisoFormProps) {
  const { toast } = useToast();
  const { subjects } = useSubjects();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');       // <- usamos 'body' (no 'content')
  const [published, setPublished] = useState(true);

  const [subjectId, setSubjectId] = useState<string>('');
  const [scope, setScope] = useState<'all' | 'family' | 'student'>('all');
  const [familyId, setFamilyId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      toast({ title: 'Faltan datos', description: 'Completa título y contenido.', variant: 'destructive' });
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast({ title: 'Sesión requerida', description: 'Inicia sesión como profesor.', variant: 'destructive' });
      return;
    }

    // ✅ comprobar permisos por CUSTOM CLAIMS (no por colección users)
    const token = await getIdTokenResult(user, true);
    const role = token.claims.role as string | undefined;
    if (role !== 'admin' && role !== 'teacher') {
      toast({ title: 'Sin permisos', description: 'Tu usuario no es profesor.', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);

      const payload: any = {
        title: title.trim(),
        body: body.trim(),          // <- este es el campo que lee tu hook
        type: 'aviso',              // o 'tarea' si lo cambias más adelante
        published,
        subjectId: subjectId || null,
        createdAt: Timestamp.now(),
        createdBy: user.uid,
        target:
          scope === 'all'
            ? { scope: 'all' }
            : scope === 'family'
            ? { scope: 'family', familyId }
            : { scope: 'student', studentId },
      };

      await addDoc(collection(db, 'avisos'), payload);

      toast({ title: '¡Éxito!', description: 'El aviso se creó correctamente.' });

      // reset
      setTitle('');
      setBody('');
      setPublished(true);
      setSubjectId('');
      setScope('all');
      setFamilyId('');
      setStudentId('');

      onCreated?.();
    } catch (error: any) {
      console.error('Error creating aviso:', error);
      toast({ title: 'Error al crear', description: error?.message ?? 'No se pudo crear el aviso.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Crear Nuevo Aviso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del aviso..." required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Contenido *</Label>
            <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escribe el contenido del aviso..." rows={8} required />
          </div>

          <div className="space-y-2">
            <Label>Asignatura (opcional)</Label>
            <select className="border p-2 rounded w-full" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">— Sin asignatura —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Alcance</Label>
            <select className="border p-2 rounded w-full" value={scope} onChange={(e) => setScope(e.target.value as any)}>
              <option value="all">Todos</option>
              <option value="family">Una familia</option>
              <option value="student">Un alumno</option>
            </select>
          </div>

          {scope === 'family' && (
            <div className="space-y-2">
              <Label htmlFor="familyId">ID de familia</Label>
              <Input id="familyId" value={familyId} onChange={(e) => setFamilyId(e.target.value)} placeholder="p.ej. garcia" required />
            </div>
          )}

          {scope === 'student' && (
            <div className="space-y-2">
              <Label htmlFor="studentId">ID de alumno</Label>
              <Input id="studentId" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="p.ej. alumno1" required />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch id="published" checked={published} onCheckedChange={setPublished} />
            <Label htmlFor="published">Publicar inmediatamente</Label>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Crear Aviso
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
