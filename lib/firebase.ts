// lib/firebase.ts
import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  connectAuthEmulator,
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Persistencia para no “perder” la sesión al recargar
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
  // Conectar emuladores si están definidos
  const authEmu = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
  const fsEmu = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST;

  if (authEmu && !(auth as any)._usingEmulator) {
    const url = authEmu.startsWith('http') ? authEmu : `http://${authEmu}`;
    connectAuthEmulator(auth, url, { disableWarnings: true });
    (auth as any)._usingEmulator = true;
  }
  if (fsEmu && !(db as any)._usingEmulator) {
    const [host, port] = fsEmu.split(':');
    connectFirestoreEmulator(db, host, Number(port));
    (db as any)._usingEmulator = true;
  }
}

export { app, auth, db };
