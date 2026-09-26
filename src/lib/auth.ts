import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';

// gmail.modify lets us read messages and remove the INBOX label (archive).
// It cannot permanently delete mail.
export const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.modify';

export type Account = { email: string; name: string | null; photo: string | null };

export class AuthError extends Error {}

GoogleSignin.configure({ scopes: [GMAIL_SCOPE] });

function toAccount(user: { user: { email: string; name: string | null; photo: string | null } }): Account {
  return { email: user.user.email, name: user.user.name, photo: user.user.photo };
}

/** Restores a previous session without any UI. Returns null if not signed in. */
export async function restoreSession(): Promise<Account | null> {
  if (!GoogleSignin.hasPreviousSignIn()) return null;
  try {
    const res = await GoogleSignin.signInSilently();
    return res.type === 'success' ? toAccount(res.data) : null;
  } catch {
    return null;
  }
}

/** Shows the Google account picker + consent screen. Returns null if cancelled. */
export async function signIn(): Promise<Account | null> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  try {
    const res = await GoogleSignin.signIn();
    if (res.type !== 'success') return null;
    if (!res.data.scopes.includes(GMAIL_SCOPE)) {
      const granted = await GoogleSignin.addScopes({ scopes: [GMAIL_SCOPE] });
      if (!granted || granted.type !== 'success') {
        throw new Error('Gmail access is needed to show your inbox.');
      }
    }
    return toAccount(res.data);
  } catch (e) {
    if (isErrorWithCode(e) && e.code === statusCodes.IN_PROGRESS) return null;
    // Google returns DEVELOPER_ERROR (code 10) when no Android OAuth client matches
    // this app's package name + signing certificate.
    if (e instanceof Error && /DEVELOPER_ERROR|\b10\b/.test(`${(e as { code?: string }).code} ${e.message}`)) {
      throw new Error(
        'Google did not recognise this app. Check the Android OAuth client in Google Cloud uses package com.bpiggin.folio and the SHA-1 from the README.'
      );
    }
    throw e;
  }
}

export async function signOut(): Promise<void> {
  await GoogleSignin.signOut();
}

let cachedToken: string | null = null;

/** Returns a valid access token. Google Play Services refreshes it for us. */
export async function getAccessToken(forceRefresh = false): Promise<string> {
  if (forceRefresh && cachedToken) {
    await GoogleSignin.clearCachedAccessToken(cachedToken).catch(() => {});
    cachedToken = null;
  }
  if (cachedToken) return cachedToken;
  try {
    const { accessToken } = await GoogleSignin.getTokens();
    cachedToken = accessToken;
    return accessToken;
  } catch {
    // getTokens fails if the session was lost — try a silent sign-in once.
    const res = await GoogleSignin.signInSilently().catch(() => null);
    if (res?.type !== 'success') throw new AuthError('Signed out');
    const { accessToken } = await GoogleSignin.getTokens();
    cachedToken = accessToken;
    return accessToken;
  }
}
