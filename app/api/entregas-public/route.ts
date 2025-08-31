import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { tareaId, nombre, apellidos, linkURL } = await req.json();
    if (!tareaId || !nombre || !apellidos || !linkURL)
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    if (!/^https?:\/\//i.test(linkURL))
      return NextResponse.json({ error: 'Enlace no válido' }, { status: 400 });

    const ref = await adminDb.collection('entregas').add({
      tareaId: String(tareaId),
      alumnoNombre: String(nombre),
      alumnoApellidos: String(apellidos),
      linkURL: String(linkURL),
      createdAt: new Date(),
      status: 'pendiente',
      source: 'public',
    });

    return NextResponse.json({ ok: true, id: ref.id });
  } catch (e) {
    console.error('entregas-public error:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
