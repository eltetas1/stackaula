'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebaseClient'; // 👈 asegúrate que el archivo se llama firebaseClient.ts, no firebase.ts
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  UserCredential 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export function useAuthUser() {
  const [user, setUser] = useState<any>(null);
  const [userDoc, setUserDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // ⚠️ en tu Firestore tienes coleccion 'families', no 'users'
        const snap = await getDoc(doc(db, 'families', u.uid));
        setUserDoc(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } else {
        setUserDoc(null);
      }
      setLoading(false);
    });
  }, []);

  return { user, userDoc, loading };
}

/**
 * Inicia sesión con email y password.
 * Devuelve UserCredential para poder leer user.uid, etc.
 */
export async function loginEmail(email: string, password: string): Promise<UserCredential> {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  await signOut(auth);
}
