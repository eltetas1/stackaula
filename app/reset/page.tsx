import { Suspense } from 'react';
import ResetForm from './ResetForm';

export default function ResetPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando…</div>}>
      <ResetForm />
    </Suspense>
  );
}
