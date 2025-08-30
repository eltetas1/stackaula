'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, getIdTokenResult, User } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient'; // asegúrate de que este archivo existe

export function useAuthClaims() {
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const token = await getIdTokenResult(u, true); // refresca claims
          setClaims(token.claims);
        } catch {
          setClaims(null);
        }
      } else {
        setClaims(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { user, claims, loading };
}
