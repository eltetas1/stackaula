// components/entregas/EstadoEntregaButtons.tsx
'use client';

import { useEffect, useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { notifyEntrega } from '@/lib/notify';

type Estado = 'pendiente' | 'revisada' | 'aprobada' | 'suspendida';

type Props = {
  entregaId: string;
  estadoActual?: Estado | null;
  grade?: number | null;
  comment?: string | null;
  className?: string;
  onAfterChange?: (nuevo: Estado) => void;
};

export default function EstadoEntregaButtons({
  entregaId,
  estadoActual = 'pendiente',
  grade = null,
  comment = null,
  className,
  onAfterChange,
}: Props) {
  const [estado, setEstado] = useState<Estado>(estadoActual || 'pendiente');
  const [busy, setBusy] = useState<Estado | null>(null);

  // Si el padre cambia el estadoActual, sincronizamos
  useEffect(() => {
    if (estadoActual && estadoActual !== estado) {
      setEstado(estadoActual);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoActual]);

  const setEstadoAction = async (nuevo: Estado) => {
    try {
      setBusy(nuevo);

      // 1) Guardar estado (y opcionalmente nota/comentario si procede)
      await updateDoc(doc(db, 'entregas', entregaId), {
        status: nuevo,
        updatedAt: serverTimestamp(),
        // Si quieres consolidar estos campos aquí, descomenta:
        // grade,
        // comment,
      });

      // 2) Notificar SOLO cuando se pulsa el botón
      await notifyEntrega(entregaId, { status: nuevo, grade, comment });

      // 3) Refrescar estado local para reflejar el cambio sin recargar página
      setEstado(nuevo);
      onAfterChange?.(nuevo);
    } catch (e) {
      console.error('EstadoEntregaButtons:setEstado', e);
    } finally {
      setBusy(null);
    }
  };

  const btn = (value: Estado, label: string) => (
    <Button
      key={value}
      variant={estado === value ? 'default' : 'secondary'}
      className="rounded px-4 py-2 text-sm"
      disabled={!!busy}
      onClick={() => setEstadoAction(value)}
    >
      {busy === value ? 'Guardando…' : label}
    </Button>
  );

  return (
    <div className={`flex gap-2 ${className || ''}`}>
      {btn('pendiente', 'Pendiente')}
      {btn('revisada', 'Revisada')}
      {btn('aprobada', 'Aprobar')}
      {btn('suspendida', 'Suspender')}
    </div>
  );
}
