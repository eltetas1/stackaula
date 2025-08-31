import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { tareaId, nombre, apellidos, linkURL } = await req.json();

    if (!tareaId || !nombre || !apellidos || !linkURL) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    }
    if (typeof linkURL !== 'string' || !/^https?:\/\//i.test(linkURL)) {
      return NextResponse.json({ error: 'Enlace no válido' }, { status: 400 });
    }

    const now = new Date();
    const docData = {
      tareaId: String(tareaId),
      alumnoNombre: String(nombre),
      alumnoApellidos: String(apellidos),
      linkURL: String(linkURL),
      createdAt: now,
      status: 'pendiente', // para revisión
      source: 'public',    // viene del formulario público
    };

    const ref = await adminDb.collection('entregas').add(docData);

    return NextResponse.json({ ok: true, id: ref.id });
  } catch (e: any) {
    console.error('entregas-public error:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
