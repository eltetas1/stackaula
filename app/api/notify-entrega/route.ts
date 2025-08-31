// app/api/notify-entrega/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import sgMail from '@sendgrid/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// --- SendGrid / configuración ---
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@example.com';
const FROM_NAME = process.env.FROM_NAME || 'Aula CEIP';
const APP_PUBLIC_URL =
  (process.env.APP_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL) ?? '';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

function buildBody(before: any, after: any) {
  const lines: string[] = ['Hola,', '', 'Se ha actualizado la entrega.', ''];

  if (before?.status !== after?.status && after?.status) {
    lines.push(`Estado: ${after.status}`);
  }
  if (before?.grade !== after?.grade && after?.grade != null) {
    lines.push(`Nota: ${after.grade}`);
  }
  if ((before?.comment || '').trim() !== (after?.comment || '').trim()) {
    lines.push('Comentario del docente:');
    const c = (after?.comment || '').trim();
    lines.push(c ? c : '(sin comentario)');
  }
  if (lines.length === 4) lines.push('(sin cambios destacados)');

  if (APP_PUBLIC_URL) {
    lines.push('', 'Puedes consultar el detalle en el portal de familias.', APP_PUBLIC_URL);
  } else {
    lines.push('', 'Puedes consultar el detalle en el portal de familias.');
  }
  lines.push('', '— Aula CEIP');

  return { text: lines.join('\n'), html: lines.join('<br/>') };
}

export async function POST(req: Request) {
  const secret = (process.env.DEV_ADMIN_SECRET || '').trim();
  const hdr = (req.headers.get('x-dev-admin-secret') || '').trim();
  if (secret && hdr !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { entregaId, changes } = await req.json();
    if (!entregaId) {
      return NextResponse.json({ error: 'Falta entregaId' }, { status: 400 });
    }

    const ref = adminDb.doc(`entregas/${entregaId}`);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Entrega no encontrada' }, { status: 404 });
    }

    const data = snap.data() || {};
    const to = (data.familyEmail || data.email || '').trim();
    if (!to) {
      return NextResponse.json({ ok: true, skipped: 'no-recipient' });
    }

    // Valores "antes" (lo que hay en Firestore)
    const beforeStatus = (data.status ?? null) as string | null;
    const beforeGrade = (data.grade ?? null) as number | null;
    const beforeComment = ((data.comment ?? '') as string).trim();

    // Valores "después" (lo que quieres notificar)
    const afterStatus = (changes?.status ?? beforeStatus) as string | null;
    const afterGrade =
      (changes?.grade ?? beforeGrade) as number | null;

    // 👇 Corregido: no mezclar ?? y || sin paréntesis
    const afterComment = (((changes?.comment ?? beforeComment) ?? '') as string).trim();

    const before = {
      status: beforeStatus,
      grade: beforeGrade,
      comment: beforeComment,
    };

    const after = {
      status: afterStatus,
      grade: afterGrade,
      comment: afterComment,
    };

    const { text, html } = buildBody(before, after);

    if (SENDGRID_API_KEY) {
      await sgMail.send({
        to,
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: 'Actualización de entrega',
        text,
        html,
      });
    } else {
      console.warn('[notify-entrega] Falta SENDGRID_API_KEY: no se envía email');
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[notify-entrega] error', e);
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 });
  }
}
