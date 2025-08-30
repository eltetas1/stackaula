import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

/**
 * Sincroniza claims de un usuario autenticado:
 * - Verifica el idToken
 * - Busca la familia por email en Firestore (colección 'familias')
 * - Si encuentra, asigna custom claims: { role: 'family', familyId, alumno }
 * - Devuelve ok y el payload de claims nuevos (el cliente deberá forzar refresh del idToken)
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const [, idToken] = authHeader.split(' ');
    if (!idToken) {
      return NextResponse.json({ error: 'Missing Authorization Bearer token' }, { status: 401 });
    }

    // Verificamos token de usuario
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email;
    if (!email) {
      return NextResponse.json({ error: 'User has no email' }, { status: 400 });
    }

    // Buscar familia por email
    const snap = await adminDb
      .collection('familias')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snap.empty) {
      // No hay familia con ese email -> quitamos role family si lo tuviera
      await adminAuth.setCustomUserClaims(uid, {});
      return NextResponse.json({ ok: true, claims: {} });
    }

    const doc = snap.docs[0];
    const familyId = doc.id;
    const data = doc.data() || {};
    const alumno = data.alumno || null;

    const newClaims = { role: 'family', familyId, alumno };

    // Si ya los tiene iguales, no hace falta escribir
    const already =
      decoded.role === 'family' &&
      decoded.familyId === familyId &&
      decoded.alumno === alumno;

    if (!already) {
      await adminAuth.setCustomUserClaims(uid, newClaims);
    }

    return NextResponse.json({ ok: true, claims: newClaims });
  } catch (e: any) {
    console.error('sync-family-claims error', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
