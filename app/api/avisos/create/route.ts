import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isLocalEnv() {
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) return true;
  if (process.env.FIRESTORE_EMULATOR_HOST) return true;
  if (process.env.FIREBASE_PROJECT_ID === 'demo-local') return true;
  if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'demo-local') return true;
  return false;
}

export async function POST(req: Request) {
  // Solo protegemos con el secreto en local
  if (isLocalEnv()) {
    const secret = process.env.DEV_ADMIN_SECRET || '';
    const hdr = (req.headers.get('x-dev-admin-secret') || '').trim();
    if (!secret || hdr !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const {
      title,
      body,
      type = 'aviso',        // 'aviso' | 'tarea'
      visible = true,        // controla 'published'
      dueDate,
      subjectId = null,
      target,                // opcional: {scope:'all'|'family'|'student', ...}
    } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Faltan título o cuerpo' }, { status: 400 });
    }

    const data: any = {
      title: String(title).trim(),
      body: String(body).trim(),
      type,
      published: !!visible,
      subjectId: subjectId || null,
      createdAt: new Date(),
    };

    if (type === 'tarea' && dueDate) data.dueDate = new Date(dueDate);
    if (target && target.scope) data.target = target;

    const docRef = await adminDb.collection('avisos').add(data);
    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || 'Error creando aviso' }, { status: 500 });
  }
}
