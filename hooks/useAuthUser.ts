// hooks/useAuthUser.ts
'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onIdTokenChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

type Role = 'teacher' | 'family' | null;

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuchamos cambios de sesión y refresco de token
    const unsub = onIdTokenChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const ref = doc(db, 'users', u.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data() as { role?: string };
            setRole((data.role as Role) ?? null);
          } else {
            setRole(null);
          }
        } catch {
          setRole(null);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { user, role, loading };
}

export async function logout() {
  await signOut(auth);
}
