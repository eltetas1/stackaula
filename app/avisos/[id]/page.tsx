'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, ClipboardList } from 'lucide-react';

type AvType = 'aviso' | 'tarea';
type AvDoc = {
  id: string;
  type?: AvType;
  title: string;
  content?: string;
  body?: string;
  subjectId?: string;
  published?: boolean;
  createdAt?: any;
  dueDate?: any;
};



export default function AvisoDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [item, setItem] = useState<AvDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'avisos', id));
        if (!snap.exists()) {
          setErrorMsg('No se encontró el aviso.');
        } else {
          setItem({ id: snap.id, ...(snap.data() as any) });
        }
      } catch (e: any) {
        setErrorMsg(e?.message ?? 'Error cargando el aviso.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-6 w-80 mb-2" />
        <Skeleton className="h-6 w-64 mb-6" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (errorMsg || !item) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-red-600">{errorMsg ?? 'No encontrado.'}</p>
      </div>
    );
  }

  const isTarea = item.type === 'tarea';
  const text = item.content ?? item.body ?? '';

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isTarea ? (
              <>
                <ClipboardList className="h-5 w-5" />
                Tarea
              </>
            ) : (
              <>
                <BookOpen className="h-5 w-5" />
                Aviso
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <h1 className="text-2xl font-bold">{item.title}</h1>

          {isTarea && item.dueDate && (
            <p className="text-sm text-gray-600">
              Entrega:{' '}
              {item.dueDate?.toDate
                ? item.dueDate.toDate().toLocaleString()
                : new Date(item.dueDate).toLocaleString()}
            </p>
          )}

          <div className="prose max-w-none">
            <p style={{ whiteSpace: 'pre-wrap' }}>{text}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
