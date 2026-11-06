export interface GoogleAccount {
  id: string; 
  email: string;
  name: string;
  avatarUrl?: string;
  /** True for guest profiles that never touch Firebase and stay on this device. */
  isLocal?: boolean;
  hasPassword: boolean;
  biometricEnabled: boolean;
  createdAt: string;
  lastActiveAt: string;
  lastSyncedAt?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; 
  tokenType?: string;
  scope?: string;
}

export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  given_name?: string;
  picture?: string;
  verified_email?: boolean;
}
