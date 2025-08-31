import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const [, token] = authHeader.split(' ');
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verifica ID token
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    // Lee /users/{uid} para obtener rol y familyId
    const userSnap = await adminDb.collection('users').doc(uid).get();
    const udata = userSnap.exists ? (userSnap.data() as any) : null;

    if (!udata || udata.role !== 'family' || !udata.familyId) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

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
      familyId: String(udata.familyId),
      createdAt: now,
      status: 'pendiente',
      source: 'auth', // viene autenticado
      uid,
    };

    const ref = await adminDb.collection('entregas').add(docData);
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (e) {
    console.error('entregas-auth error:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
