// src/hooks/useUserRole.ts
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export function useUserRole() {
  const [user, setUser] = useState<import('firebase/auth').User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Espera a Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  // Lee en vivo users/{uid}
  useEffect(() => {
    if (!user) { setRole(null); setLoading(false); return; }
    setLoading(true);
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setRole(snap.exists() ? ((snap.data() as any).role ?? null) : null);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user]);

  return { user, role, loading };
}
