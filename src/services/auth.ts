import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import type { GoogleAccount, AuthTokens, GoogleUserProfile } from '@/types/auth';

WebBrowser.maybeCompleteAuthSession();


const KEY_ACCOUNTS = 'yohaku.accounts.list';
const KEY_ACTIVE_ACCOUNT_ID = 'yohaku.accounts.active_id';

const getPasswordKey = (accId: string) => `yohaku.acc.${accId}.pwd_hash`;
const getTokensKey = (accId: string) => `yohaku.acc.${accId}.tokens`;


export const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/drive.appdata',
];

export const GOOGLE_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  userInfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
};


export function getGoogleClientId(): string | null {
  if (Platform.OS === 'ios') {
    return (
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
      null
    );
  }
  if (Platform.OS === 'android') {
    return (
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
      null
    );
  }
  return (
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    null
  );
}

export async function hashPassword(password: string, accountId: string): Promise<string> {
  const salted = `yohaku_${accountId}_${password}`;
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, salted);
}

export async function saveAccountPassword(accountId: string, rawPassword: string): Promise<void> {
  const hash = await hashPassword(rawPassword, accountId);
  await SecureStore.setItemAsync(getPasswordKey(accountId), hash);
}

export async function verifyAccountPassword(accountId: string, inputPassword: string): Promise<boolean> {
  const storedHash = await SecureStore.getItemAsync(getPasswordKey(accountId));
  if (!storedHash) return false;
  const inputHash = await hashPassword(inputPassword, accountId);
  return storedHash === inputHash;
}

export async function saveAccountTokens(accountId: string, tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(getTokensKey(accountId), JSON.stringify(tokens));
}

export async function getAccountTokens(accountId: string): Promise<AuthTokens | null> {
  const raw = await SecureStore.getItemAsync(getTokensKey(accountId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthTokens;
  } catch {
    return null;
  }
}

export async function removeAccountTokens(accountId: string): Promise<void> {
  await SecureStore.deleteItemAsync(getTokensKey(accountId));
}

export async function loadRegisteredAccounts(): Promise<GoogleAccount[]> {
  try {
    const raw = await SecureStore.getItemAsync(KEY_ACCOUNTS);
    if (!raw) return [];
    return JSON.parse(raw) as GoogleAccount[];
  } catch {
    return [];
  }
}

export async function saveRegisteredAccounts(accounts: GoogleAccount[]): Promise<void> {
  await SecureStore.setItemAsync(KEY_ACCOUNTS, JSON.stringify(accounts));
}

export async function getActiveAccountId(): Promise<string | null> {
  return await SecureStore.getItemAsync(KEY_ACTIVE_ACCOUNT_ID);
}

export async function setActiveAccountId(id: string | null): Promise<void> {
  if (id) {
    await SecureStore.setItemAsync(KEY_ACTIVE_ACCOUNT_ID, id);
  } else {
    await SecureStore.deleteItemAsync(KEY_ACTIVE_ACCOUNT_ID);
  }
}

export async function promptGoogleAuth(): Promise<{
  profile: GoogleUserProfile;
  tokens: AuthTokens;
} | null> {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error('MISSING_CLIENT_ID');
  }

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'expense',
    path: 'oauth',
  });

  const request = new AuthSession.AuthRequest({
    clientId,
    scopes: GOOGLE_SCOPES,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  });

  const result = await request.promptAsync(GOOGLE_DISCOVERY);
  if (result.type !== 'success' || !result.params.code) {
    return null;
  }


  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code: result.params.code,
      redirectUri,
      extraParams: request.codeVerifier
        ? { code_verifier: request.codeVerifier }
        : {},
    },
    GOOGLE_DISCOVERY
  );

  const accessToken = tokenResponse.accessToken;
  const refreshToken = tokenResponse.refreshToken;
  const expiresIn = tokenResponse.expiresIn || 3600;
  const expiresAt = Date.now() + expiresIn * 1000;

  const profileRes = await fetch(GOOGLE_DISCOVERY.userInfoEndpoint!, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!profileRes.ok) {
    throw new Error(`Failed to fetch user profile: ${profileRes.statusText}`);
  }

  const profile = (await profileRes.json()) as GoogleUserProfile;

  return {
    profile,
    tokens: {
      accessToken,
      refreshToken: refreshToken || undefined,
      expiresAt,
      tokenType: tokenResponse.tokenType,
      scope: tokenResponse.scope,
    },
  };
}

export async function refreshGoogleTokenIfNeeded(
  accountId: string
): Promise<string | null> {
  const tokens = await getAccountTokens(accountId);
  if (!tokens) return null;


  if (tokens.expiresAt > Date.now() + 5 * 60 * 1000) {
    return tokens.accessToken;
  }

  if (!tokens.refreshToken) {
    return tokens.accessToken; 
  }

  const clientId = getGoogleClientId();
  if (!clientId) return tokens.accessToken;

  try {
    const refreshed = await AuthSession.refreshAsync(
      {
        clientId,
        refreshToken: tokens.refreshToken,
      },
      GOOGLE_DISCOVERY
    );

    const newTokens: AuthTokens = {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken || tokens.refreshToken,
      expiresAt: Date.now() + (refreshed.expiresIn || 3600) * 1000,
      tokenType: refreshed.tokenType || tokens.tokenType,
      scope: refreshed.scope || tokens.scope,
    };

    await saveAccountTokens(accountId, newTokens);
    return newTokens.accessToken;
  } catch (err) {
    console.warn('Failed to refresh Google token:', err);
    return tokens.accessToken;
  }
}
