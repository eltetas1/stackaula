// lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';

declare global {
  // evita re-inicializar en hot reload
  // eslint-disable-next-line no-var
  var _adminApp: admin.app.App | undefined;
}

function init() {
  if (!global._adminApp) {
    const usingEmulators =
      !!process.env.FIREBASE_AUTH_EMULATOR_HOST ||
      !!process.env.FIRESTORE_EMULATOR_HOST;

    if (usingEmulators) {
      // ⬅️ En LOCAL con emuladores: NADA de credential.cert()
      global._adminApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'demo-local',
      });

      // Señalar a los emuladores (Auth/Firestore)
      process.env.FIREBASE_AUTH_EMULATOR_HOST =
        process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
      process.env.FIRESTORE_EMULATOR_HOST =
        process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
    } else {
      // ⬅️ Producción / proyecto real
      global._adminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        } as admin.ServiceAccount),
      });
    }
  }
  return global._adminApp!;
}

const app = init();

export const adminAuth = admin.auth(app);
export const adminDb = admin.firestore(app);
