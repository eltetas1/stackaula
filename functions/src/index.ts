import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';

admin.initializeApp();

// Lee primero de .env, si no, usa functions.config() (compatibilidad)
const SENDGRID_KEY =
  process.env.SENDGRID_KEY || (functions.config().sendgrid?.key as string);
const SENDGRID_FROM =
  process.env.SENDGRID_FROM || (functions.config().sendgrid?.from as string);

sgMail.setApiKey(SENDGRID_KEY);

// Helper para obtener emails de la familia
async function getFamilyEmails(familyId?: string, uid?: string): Promise<string[]> {
  const emails: string[] = [];
  const db = admin.firestore();

  if (familyId) {
    const f = await db.doc(`families/${familyId}`).get();
    if (f.exists) {
      const d = f.data() || {};
      if (Array.isArray(d.emails)) emails.push(...d.emails);
      if (typeof d.email === 'string') emails.push(d.email);
    }
  }

  // fallback: email del usuario (si hubiera)
  if (uid) {
    const u = await db.doc(`users/${uid}`).get();
    const d = u.data() || {};
    if (typeof d.email === 'string') emails.push(d.email);
  }

  // único por si hay duplicados
  return Array.from(new Set(emails.filter(Boolean)));
}

// Compose email
function buildEmail(subject: string, html: string, to: string[]) {
  return {
    to,
    from: SENDGRID_FROM,
    subject,
    html,
  };
}

// Dispara en creaciones/actualizaciones de entregas
export const onEntregaWrite = functions.firestore
  .document('entregas/{id}')
  .onWrite(async (change, ctx) => {
    const before = change.before.exists ? change.before.data()! : {};
    const after = change.after.exists ? change.after.data()! : {};
    if (!change.after.exists) return;

    const changedStatus = before.status !== after.status;
    const changedComment = before.comentarioDocente !== after.comentarioDocente;
    const changedNota = before.nota !== after.nota;

    if (!changedStatus && !changedComment && !changedNota) return;

    const db = admin.firestore();

    // Título de la tarea
    let tareaTitulo = '';
    if (after.tareaId) {
      const tSnap = await db.doc(`tareas/${after.tareaId}`).get();
      tareaTitulo = tSnap.exists ? (tSnap.data() as any)?.title || '' : '';
    }

    const to = await getFamilyEmails(after.familyId, after.uid);
    if (!to.length) return;

    const partes: string[] = [];
    if (changedStatus) partes.push(`Estado: <b>${after.status}</b>`);
    if (changedNota !== undefined && changedNota) partes.push(`Nota: <b>${after.nota}</b>`);
    if (changedComment && after.comentarioDocente) partes.push(`Comentario del docente: <blockquote>${(after.comentarioDocente as string).replace(/\n/g, '<br>')}</blockquote>`);

    const subject = `Actualización de entrega${tareaTitulo ? ` — ${tareaTitulo}` : ''}`;
    const html = `
      <p>Hola,</p>
      <p>Se ha actualizado la entrega ${tareaTitulo ? `de <b>${tareaTitulo}</b>` : ''}.</p>
      <ul>${partes.map((p) => `<li>${p}</li>`).join('')}</ul>
      <p>Puedes consultar el detalle accediendo al portal de familias.</p>
      <p>— Aula CEIP</p>
    `;

    try {
      await sgMail.send(buildEmail(subject, html, to));
    } catch (e) {
      console.error('Error enviando email de entrega:', e);
    }
  });
