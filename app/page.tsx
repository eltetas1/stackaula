'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
      <h1 className="text-3xl font-bold">Bienvenido al Aula CEIP</h1>

      <Button asChild size="lg" className="px-8 py-4 text-lg">
        <Link href="/login">Login</Link>
      </Button>
    </main>
  );
}
