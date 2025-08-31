import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';

admin.initializeApp();

// Lazy init de SendGrid para evitar avisos en deploy y asegurar .env/config en runtime
let sgReady = false;
function ensureSendgrid() {
  const key =
    process.env.SENDGRID_KEY || (functions.config().sendgrid?.key as string | undefined);
  const from =
    process.env.SENDGRID_FROM || (functions.config().sendgrid?.from as string | undefined);

  if (!key || !from) {
    return { ok: false, from: '' as const };
  }
  if (!sgReady) {
    sgMail.setApiKey(key);
    sgReady = true;
  }
  return { ok: true, from };
}

// Obtener emails de la familia (families/{id}.email|emails[]) + fallback users/{uid}.email
async function getFamilyEmails(familyId?: string, uid?: string): Promise<string[]> {
  const db = admin.firestore();
  const out = new Set<string>();

  try {
    if (familyId) {
      const f = await db.doc(`families/${familyId}`).get();
      if (f.exists) {
        const d = f.data() || {};
        if (Array.isArray(d.emails)) d.emails.forEach((e: any) => e && out.add(String(e)));
        if (typeof d.email === 'string') out.add(d.email);
      }
    }
    if (uid) {
      const u = await db.doc(`users/${uid}`).get();
      const d = u.data() || {};
      if (typeof d.email === 'string') out.add(d.email);
    }
  } catch (e) {
    console.error('[getFamilyEmails] error:', e);
  }
  return Array.from(out);
}

export const onEntregaWrite = functions.firestore
  .document('entregas/{id}')
  .onWrite(async (change, ctx) => {
    if (!change.after.exists) return;

    const before = change.before.exists ? change.before.data()! : {};
    const after = change.after.data()!;

    const changedStatus = before.status !== after.status;
    const changedComment = before.comentarioDocente !== after.comentarioDocente;
    const changedNota = before.nota !== after.nota;
    if (!changedStatus && !changedComment && !changedNota) return;

    const db = admin.firestore();

    // Título de la tarea
    let tareaTitulo = '';
    try {
      if (after.tareaId) {
        const tSnap = await db.doc(`tareas/${after.tareaId}`).get();
        tareaTitulo = tSnap.exists ? ((tSnap.data() as any)?.title || '') : '';
      }
    } catch (e) {
      console.warn('[onEntregaWrite] lookup tarea error:', e);
    }

    // Destinatarios
    const to = await getFamilyEmails(after.familyId, after.uid);
    if (!to.length) {
      console.warn('[onEntregaWrite] sin destinatarios para entrega', ctx.params.id);
      return;
    }

    // SendGrid listo
    const sg = ensureSendgrid();
    if (!sg.ok) {
      console.warn(
        '[onEntregaWrite] SendGrid no configurado. Define SENDGRID_KEY y SENDGRID_FROM en functions/.env o con functions.config().'
      );
      return;
    }

    const partes: string[] = [];
    if (changedStatus) partes.push(`Estado: <b>${after.status}</b>`);
    if (changedNota) partes.push(`Nota: <b>${after.nota ?? '—'}</b>`);
    if (changedComment && after.comentarioDocente) {
      const htmlComment = String(after.comentarioDocente).replace(/\n/g, '<br>');
      partes.push(`Comentario del docente:<br><blockquote>${htmlComment}</blockquote>`);
    }

    const subject =
      `Actualización de entrega` + (tareaTitulo ? ` — ${tareaTitulo}` : '');
    const html =
      `<p>Hola,</p>
       <p>Se ha actualizado la entrega${tareaTitulo ? ` de <b>${tareaTitulo}</b>` : ''}.</p>
       <ul>${partes.map((p) => `<li>${p}</li>`).join('')}</ul>
       <p>Puedes consultar el detalle en el portal de familias.</p>
       <p>— Aula CEIP</p>`;

    try {
      await sgMail.send({
        to,
        from: sg.from,
        subject,
        html
      });
      console.log('[onEntregaWrite] Email enviado a:', to);
    } catch (e) {
      console.error('[onEntregaWrite] Error enviando email:', e);
    }
  });
