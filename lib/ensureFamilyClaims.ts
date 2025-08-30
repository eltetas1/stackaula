import { getAuth } from 'firebase/auth';

export async function ensureFamilyClaims(): Promise<void> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return;

  const idToken = await user.getIdToken(); // token actual
  await fetch('/api/auth/sync-family-claims', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${idToken}`,
    },
  }).catch(() => {});

  // Muy importante: refrescar para que el cliente reciba los nuevos claims
  await user.getIdToken(true);
}
