// hooks/useAuthUser.ts
'use client';

import { useEffect, useMemo, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  onIdTokenChanged,
  signOut,
  User as FirebaseUser,
  sendSignInLinkToEmail,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

type Role = 'teacher' | 'family' | null;

export type UserProfile = {
  role?: Role extends null ? never : Exclude<Role, null>;
  familyId?: string;
};

export type UserExtended = FirebaseUser & {
  /** Campos que traemos del doc users/{uid} */
  role?: Role;
  familyId?: string | null;
};

export function useAuthUser() {
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (u) => {
      setFbUser(u);
      if (u) {
        try {
          const ref = doc(db, 'users', u.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setProfile({
              role: (data.role as any) ?? null,
              familyId: data.familyId ?? undefined,
            });
          } else {
            setProfile(null);
          }
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Mezclamos los campos del perfil en el usuario para mantener compatibilidad:
  const user: UserExtended | null = useMemo(() => {
    if (!fbUser) return null;
    const merged: UserExtended = Object.assign({}, fbUser, {
      role: (profile?.role as Role) ?? null,
      familyId: profile?.familyId ?? null,
    });
    return merged;
  }, [fbUser, profile]);

  const role: Role = (profile?.role as Role) ?? null;
  const familyId: string | null = profile?.familyId ?? null;

  return { user, role, familyId, loading };
}

export async function logout() {
  await signOut(auth);
}

/**
 * loginEmail
 * Envía un enlace mágico (passwordless) al correo indicado.
 * Si ya tienes una página /login que procesa el enlace,
 * déjalo tal cual. Puedes llamarlo desde cualquier componente.
 */
export async function loginEmail(email: string, returnUrl?: string) {
  if (!email || !email.includes('@')) {
    throw new Error('Introduce un correo válido');
  }
  const url =
    returnUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/login`
      : '/login');

  const actionCodeSettings = {
    url,
    handleCodeInApp: true,
  };

  if (typeof window !== 'undefined') {
    window.localStorage.setItem('loginEmail', email);
  }
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
}
