import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  const secret = process.env.DEV_ADMIN_SECRET;
  const hdr = (req.headers.get('x-dev-admin-secret') || '').trim();
  if (!secret || hdr !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { email, role } = await req.json();
    if (!email || !role) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    const user = await adminAuth.getUserByEmail(email);
    await adminAuth.setCustomUserClaims(user.uid, { role });
    return NextResponse.json({ ok: true, uid: user.uid, role });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}
