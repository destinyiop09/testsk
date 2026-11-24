import {createClient, type SupabaseClient} from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

function readSupabaseConfig(): {url: string; publishableKey: string} {
  const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
  const publishableKey = String(
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  ).trim();
  return {url, publishableKey};
}

export function isSupabaseConfigured(): boolean {
  const {url, publishableKey} = readSupabaseConfig();
  return Boolean(url && publishableKey);
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const {url, publishableKey} = readSupabaseConfig();
  if (!url || !publishableKey) return null;

  cachedClient = createClient(url, publishableKey, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return cachedClient;
}

export interface SupabaseOAuthCallbackPayload {
  type: 'SUPABASE_OAUTH_CALLBACK';
  code?: string;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
  errorDescription?: string;
}

export async function resolveSupabaseAccessTokenFromCallback(
  payload: Pick<
    SupabaseOAuthCallbackPayload,
    'code' | 'accessToken' | 'refreshToken' | 'error' | 'errorDescription'
  >,
): Promise<string> {
  if (payload.error) {
    throw new Error(payload.errorDescription || payload.error);
  }

  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase authentication is not configured.');
  }

  if (payload.code) {
    const {data, error} = await client.auth.exchangeCodeForSession(payload.code);
    if (error || !data.session?.access_token) {
      throw new Error(error?.message || 'Failed to exchange Google OAuth code.');
    }
    return data.session.access_token;
  }

  if (payload.accessToken) {
    if (payload.refreshToken) {
      const {data, error} = await client.auth.setSession({
        access_token: payload.accessToken,
        refresh_token: payload.refreshToken,
      });
      if (!error && data.session?.access_token) {
        return data.session.access_token;
      }
    }
    return payload.accessToken;
  }

  const {data} = await client.auth.getSession();
  if (data.session?.access_token) {
    return data.session.access_token;
  }

  throw new Error('Google sign-in did not return a valid session token.');
}

export async function signOutSupabase(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.auth.signOut();
  } catch {
    // ignore sign-out network errors on client
  }
}
