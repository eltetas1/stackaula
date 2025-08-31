'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

type AppUser = {
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

        // Lee el doc /users/{uid} SOLO si hay login
        const ref = doc(db, 'users', fbUser.uid);
        let role: any = undefined;
        let familyId: any = undefined;

        try {
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const d = snap.data() as any;
            role = d.role;
            familyId = d.familyId;
          }
        } catch (e) {
          console.error('Error leyendo /users:', e);
        }

        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          role,
          familyId,
        });
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  return { user, loading };
}
