'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebaseClient';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

type Familia = {
  id: string;
  email: string;
  tutor: string;
  alumno: string;
};

export default function ListFamiliasPage() {
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal edición
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [tutor, setTutor] = useState('');
  const [alumno, setAlumno] = useState('');
  const [saving, setSaving] = useState(false);

  const editTarget = useMemo(
    () => familias.find((f) => f.id === editId) || null,
    [familias, editId]
  );

  // Cargar familias
  useEffect(() => {
    const fetchFamilias = async () => {
      try {
        const snap = await getDocs(collection(db, 'familias'));
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Familia, 'id'>),
        }));
        setFamilias(data);
      } finally {
        setLoading(false);
      }
    };
    fetchFamilias();
  }, []);

  // Abrir modal con datos
  const openEdit = (f: Familia) => {
    setEditId(f.id);
    setEmail(f.email || '');
    setTutor(f.tutor || '');
    setAlumno(f.alumno || '');
    setOpen(true);
  };

  const closeEdit = () => {
    setOpen(false);
    setEditId(null);
    setEmail('');
    setTutor('');
    setAlumno('');
    setSaving(false);
  };

  // Guardar cambios
  const handleSave = async () => {
    if (!editId) return;
    if (!email.trim() || !tutor.trim() || !alumno.trim()) return;

    setSaving(true);
    const ref = doc(db, 'familias', editId);

    // Optimistic UI
    const prev = familias;
    const updatedLocal = prev.map((f) =>
      f.id === editId ? { ...f, email: email.trim(), tutor: tutor.trim(), alumno: alumno.trim() } : f
    );
    setFamilias(updatedLocal);

    try {
      await updateDoc(ref, {
        email: email.trim(),
        tutor: tutor.trim(),
        alumno: alumno.trim(),
      });
      closeEdit();
    } catch (e) {
      // revertir si falla
      setFamilias(prev);
      setSaving(false);
      alert('No se pudieron guardar los cambios.');
    }
  };

  // Borrar familia
  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar esta familia?')) return;
    const prev = familias;
    setFamilias((p) => p.filter((f) => f.id !== id));
    try {
      await deleteDoc(doc(db, 'familias', id));
    } catch {
      setFamilias(prev);
      alert('No se pudo eliminar. Intenta de nuevo.');
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Todas las familias</h1>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href="/maestro/familias">Crear familia</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/maestro">Volver al panel</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de familias</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Cargando…</p>
          ) : familias.length === 0 ? (
            <p className="text-gray-500">No hay familias registradas.</p>
          ) : (
            <ul className="space-y-3">
              {familias.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between border rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium">{f.email}</p>
                    <p className="text-sm text-gray-600">
                      {f.tutor} — {f.alumno}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => openEdit(f)}>
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(f.id)}
                    >
                      Borrar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Modal de edición */}
      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : closeEdit())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar familia</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="email">Email de la familia</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="familia@email.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tutor">Nombre del tutor/a</Label>
              <Input
                id="tutor"
                value={tutor}
                onChange={(e) => setTutor(e.target.value)}
                placeholder="Nombre del tutor/a"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="alumno">Nombre del alumno/a</Label>
              <Input
                id="alumno"
                value={alumno}
                onChange={(e) => setAlumno(e.target.value)}
                placeholder="Nombre del alumno/a"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={closeEdit} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !email || !tutor || !alumno}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
