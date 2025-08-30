import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  // Protección simple en local con header x-dev-admin-secret
  const secret = process.env.DEV_ADMIN_SECRET;
  const hdr = (req.headers.get('x-dev-admin-secret') || '').trim();
  if (secret && hdr !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, body, type = 'aviso', visible = true, dueDate } = await req.json();
    if (!title || !body) {
      return NextResponse.json({ error: 'Faltan título o cuerpo' }, { status: 400 });
    }

    const now = new Date();
    const data: any = {
      title,
      body,
      type,            // 'aviso' | 'tarea'
      published: true, // tu hook filtra por 'published: true'
      createdAt: now,
    };
    if (type === 'tarea' && dueDate) data.dueDate = new Date(dueDate);

    const docRef = await adminDb.collection('avisos').add(data);
    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Error creando aviso' }, { status: 500 });
  }
}
