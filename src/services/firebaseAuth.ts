import { auth } from '../../firebaseConfig';
import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import type { GoogleUserProfile, AuthTokens } from '@/types/auth';

export async function loginAnonymously(): Promise<{
  profile: GoogleUserProfile;
  tokens: AuthTokens;
}> {
  const userCredential = await signInAnonymously(auth);
  const user = userCredential.user;

  const profile: GoogleUserProfile = {
    id: user.uid,
    email: user.email || `offline_${user.uid.slice(0, 8)}@local.device`,
    name: user.displayName || 'Guest User',
  };

  const token = await user.getIdToken();
  const tokens: AuthTokens = {
    accessToken: token,
    expiresAt: Date.now() + 3600 * 1000,
  };

  return { profile, tokens };
}

export async function loginWithEmail(
  email: string,
  pass: string
): Promise<{
  profile: GoogleUserProfile;
  tokens: AuthTokens;
}> {
  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(auth, email, pass);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    } else {
      throw err;
    }
  }

  const user = userCredential.user;
  const profile: GoogleUserProfile = {
    id: user.uid,
    email: user.email || email,
    name: user.displayName || email.split('@')[0],
  };

  const token = await user.getIdToken();
  const tokens: AuthTokens = {
    accessToken: token,
    expiresAt: Date.now() + 3600 * 1000,
  };

  return { profile, tokens };
}
