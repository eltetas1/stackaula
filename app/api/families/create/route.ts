// app/api/families/create/route.ts
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function sendInviteEmail(email: string) {
  const key = process.env.FIREBASE_WEB_API_KEY!;
  const continueUrl = `${process.env.SITE_URL || 'http://localhost:3000'}/reset`;
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email,
        continueUrl,       // tras crear la contraseña vuelve a /reset de tu app
        canHandleCodeInApp: true,
      }),
    }
  );
  if (!res.ok) {
    const info = await res.json().catch(() => ({}));
    throw new Error(info?.error?.message || 'Error enviando invitación');
  }
}

export async function POST(req: Request) {
  const secret = process.env.DEV_ADMIN_SECRET;
  const hdr = (req.headers.get('x-dev-admin-secret') || '').trim();
  if (secret && hdr !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, guardianName, studentName } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 });

    // 1) Crear u obtener usuario
    let user;
    try {
      user = await adminAuth.getUserByEmail(email);
    } catch {
      user = await adminAuth.createUser({ email, disabled: false });
    }

    // 2) Claims
    await adminAuth.setCustomUserClaims(user.uid, { role: 'family' });

    // 3) Ficha
    await adminDb.collection('families').doc(user.uid).set(
      {
        email,
        guardianName: guardianName ?? null,
        studentName: studentName ?? null,
        classroom: process.env.AULA_CLASS_NAME ?? 'Clase Única',
        tutorName: process.env.AULA_TUTOR_NAME ?? 'Tutor/a',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    );

    // 4) Local: devolver link; Producción: enviar email real
    const inEmulator =
      !!process.env.FIREBASE_AUTH_EMULATOR_HOST ||
      !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST ||
      process.env.FIREBASE_PROJECT_ID === 'demo-local' ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'demo-local';

    if (inEmulator) {
      const raw = await adminAuth.generatePasswordResetLink(email, {
        url: 'http://localhost:3000/reset',
        handleCodeInApp: true,
      });
      const u = new URL(raw);
      const oob = u.searchParams.get('oobCode') || '';
      const inviteLink = `http://localhost:3000/reset?oobCode=${encodeURIComponent(oob)}`;
      return NextResponse.json({ ok: true, uid: user.uid, inviteLink });
    } else {
      await sendInviteEmail(email);
      return NextResponse.json({ ok: true, uid: user.uid });
    }
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message || 'Error creando familia' }, { status: 500 });
  }
}
