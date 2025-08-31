'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export type AppUser = {
  uid: string;
  email?: string | null;
  role?: 'teacher' | 'family';
  familyId?: string;
};

export function useAuthUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (!fbUser) {
          setUser(null);
          return;
        }
        const snap = await getDoc(doc(db, 'users', fbUser.uid));
        const data = snap.exists() ? (snap.data() as any) : {};
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          role: data.role,
          familyId: data.familyId,
        });
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  return { user, loading };
}

// 👇 Estos dos exports arreglan tu build
export async function loginEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  return signOut(auth);
}
