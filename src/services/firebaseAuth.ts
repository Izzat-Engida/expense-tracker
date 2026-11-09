import { auth } from '../../firebaseConfig';
import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  verifyBeforeUpdateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
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

export async function signInWithEmail(
  email: string,
  pass: string
): Promise<{
  profile: GoogleUserProfile;
  tokens: AuthTokens;
}> {
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const user = userCredential.user;
  const profile: GoogleUserProfile = {
    id: user.uid,
    email: user.email || email.trim(),
    name: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
  };

  const token = await user.getIdToken();
  const tokens: AuthTokens = {
    accessToken: token,
    expiresAt: Date.now() + 3600 * 1000,
  };

  return { profile, tokens };
}

export async function signUpWithEmail(
  email: string,
  pass: string
): Promise<{
  profile: GoogleUserProfile;
  tokens: AuthTokens;
}> {
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const user = userCredential.user;
  const profile: GoogleUserProfile = {
    id: user.uid,
    email: user.email || email.trim(),
    name: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
  };

  const token = await user.getIdToken();
  const tokens: AuthTokens = {
    accessToken: token,
    expiresAt: Date.now() + 3600 * 1000,
  };

  return { profile, tokens };
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function updateFirebaseUsername(newName: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in to cloud.');
  }
  await updateProfile(user, { displayName: newName.trim() });
}

export async function updateFirebaseEmail(
  currentPass: string,
  newEmail: string
): Promise<{ emailUpdatedImmediately: boolean }> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('No active user is currently signed in to cloud.');
  }

  // Re-authenticate first to ensure session is valid
  const cred = EmailAuthProvider.credential(user.email, currentPass);
  await reauthenticateWithCredential(user, cred);

  try {
    await updateEmail(user, newEmail.trim());
    return { emailUpdatedImmediately: true };
  } catch (err: any) {
    if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/requires-recent-login') {
      throw err;
    }
    try {
      await verifyBeforeUpdateEmail(user, newEmail.trim());
      return { emailUpdatedImmediately: false };
    } catch {
      throw err;
    }
  }
}

export async function updateFirebasePassword(
  currentPass: string,
  newPass: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('No active user is currently signed in to cloud.');
  }

  // Re-authenticate first
  const cred = EmailAuthProvider.credential(user.email, currentPass);
  await reauthenticateWithCredential(user, cred);

  // Update password
  await updatePassword(user, newPass);
}

export function getAuthErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred.';
  const code = err.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect email or password. Please verify your credentials.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please check your spelling or sign up.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please wait a few moments or reset your password.';
    case 'auth/requires-recent-login':
      return 'For security, please enter your current password to confirm this change.';
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet connection.';
    default:
      return err.message || 'Authentication error. Please try again.';
  }
}

export async function loginWithEmail(
  email: string,
  pass: string
): Promise<{
  profile: GoogleUserProfile;
  tokens: AuthTokens;
}> {
  try {
    return await signInWithEmail(email, pass);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      return await signUpWithEmail(email, pass);
    }
    throw err;
  }
}
