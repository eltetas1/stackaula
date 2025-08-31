// components/entregas/EstadoEntregaButtons.tsx
'use client';

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { notifyEntrega } from '@/lib/notify';

type Estado =
  | 'pendiente'
  | 'revisada'
  | 'aprobada'
  | 'suspendida';

type Props = {
  entregaId: string;
  estadoActual?: Estado | null;
  // Si tu UI también edita nota/comentario y quieres incluirlos en el correo:
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
  const [busy, setBusy] = useState<Estado | null>(null);

  const setEstado = async (estado: Estado) => {
    try {
      setBusy(estado);
      // 1) Guardar estado (y opcionalmente nota/comentario si quieres consolidarlo aquí)
      await updateDoc(doc(db, 'entregas', entregaId), {
        status: estado,
        // descomenta si quieres consolidar:
        // grade,
        // comment,
        updatedAt: new Date(),
      });

      // 2) Notificar SOLO cuando se pulsa el botón
      await notifyEntrega(entregaId, {
        status: estado,
        grade,
        comment,
      });

      onAfterChange?.(estado);
    } catch (e) {
      console.error('EstadoEntregaButtons:setEstado', e);
      // aquí puedes mostrar un toast si tienes
    } finally {
      setBusy(null);
    }
  };

  const btnClass = 'rounded px-4 py-2 text-sm';

  return (
    <div className={`flex gap-2 ${className || ''}`}>
      <Button
        variant={estadoActual === 'pendiente' ? 'default' : 'secondary'}
        className={btnClass}
        disabled={busy !== null}
        onClick={() => setEstado('pendiente')}
      >
        {busy === 'pendiente' ? 'Guardando…' : 'Pendiente'}
      </Button>

      <Button
        variant={estadoActual === 'revisada' ? 'default' : 'secondary'}
        className={btnClass}
        disabled={busy !== null}
        onClick={() => setEstado('revisada')}
      >
        {busy === 'revisada' ? 'Guardando…' : 'Revisada'}
      </Button>

      <Button
        variant={estadoActual === 'aprobada' ? 'default' : 'secondary'}
        className={btnClass}
        disabled={busy !== null}
        onClick={() => setEstado('aprobada')}
      >
        {busy === 'aprobada' ? 'Guardando…' : 'Aprobar'}
      </Button>

      <Button
        variant={estadoActual === 'suspendida' ? 'default' : 'secondary'}
        className={btnClass}
        disabled={busy !== null}
        onClick={() => setEstado('suspendida')}
      >
        {busy === 'suspendida' ? 'Guardando…' : 'Suspender'}
      </Button>
    </div>
  );
}
