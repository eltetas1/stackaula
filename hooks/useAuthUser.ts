// hooks/useAuthUser.ts
'use client';

import { useEffect, useMemo, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  onIdTokenChanged,
  signOut,
  User as FirebaseUser,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type Role = 'teacher' | 'family' | null;

export type UserExtended = FirebaseUser & {
  role?: Role;
  familyId?: string | null;
};

export function useAuthUser() {
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (u) => {
      setFbUser(u);
      if (u) {
        try {
          const ref = doc(db, 'users', u.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data() as { role?: Role; familyId?: string };
            setRole((data.role as Role) ?? null);
            setFamilyId(data.familyId ?? null);
          } else {
            setRole(null);
            setFamilyId(null);
          }
        } catch {
          setRole(null);
          setFamilyId(null);
        }
      } else {
        setRole(null);
        setFamilyId(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const user: UserExtended | null = useMemo(() => {
    if (!fbUser) return null;
    const merged: UserExtended = Object.assign({}, fbUser, {
      role,
      familyId,
    });
    return merged;
  }, [fbUser, role, familyId]);

  return { user, role, familyId, loading };
}

export async function logout() {
  await signOut(auth);
}

/** === Compatibilidad: login por ENLACE MÁGICO === */
export async function loginEmail(email: string, returnUrl?: string) {
  if (!email || !email.includes('@')) throw new Error('Introduce un correo válido');
  const url =
    returnUrl ||
    (typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login');
  if (typeof window !== 'undefined') window.localStorage.setItem('loginEmail', email);
  await sendSignInLinkToEmail(auth, email, { url, handleCodeInApp: true });
}

export async function completeMagicLinkIfPresent() {
  if (typeof window === 'undefined') return false;
  const href = window.location.href;
  if (!isSignInWithEmailLink(auth, href)) return false;
  let email = window.localStorage.getItem('loginEmail') || '';
  if (!email) email = window.prompt('Introduce tu correo para completar el acceso') || '';
  await signInWithEmailLink(auth, email, href);
  window.localStorage.removeItem('loginEmail');
  return true;
}

/** === Login clásico: email + password === */
export async function loginPassword(email: string, password: string) {
  if (!email || !password) throw new Error('Correo y contraseña requeridos');
  await signInWithEmailAndPassword(auth, email, password);
}

/** (opcional) Registro por email + password y creación del doc users/{uid} */
export async function registerPassword(opts: {
  email: string;
  password: string;
  displayName?: string;
  role?: Exclude<Role, null>;
  familyId?: string;
}) {
  const { email, password, displayName, role, familyId } = opts;
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(cred.user, { displayName });
  const ref = doc(db, 'users', cred.user.uid);
  await setDoc(ref, { role: role ?? 'family', familyId: familyId ?? null }, { merge: true });
  return cred.user;
}
