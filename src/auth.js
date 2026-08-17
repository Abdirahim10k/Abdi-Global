const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || import.meta.env.VITE_SUPABASE_ANON_KEY
  || '';
const sessionKey = 'abdiglobal.auth.session';

export function isAuthConfigured() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

function authHeaders(accessToken) {
  const headers = {
    apikey: supabasePublishableKey,
    'Content-Type': 'application/json'
  };

  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.msg || data.message || data.error_description || 'Authentication request failed.');
  }
  return data;
}

function storeSession(session) {
  if (!session?.access_token || !session?.user) return;
  const expiresAt = session.expires_at || Math.floor(Date.now() / 1000) + (session.expires_in || 3600);
  localStorage.setItem(sessionKey, JSON.stringify({ ...session, expires_at: expiresAt }));
}

function readSession() {
  try {
    const session = JSON.parse(localStorage.getItem(sessionKey));
    if (!session?.access_token || !session?.user) return null;
    if (session.expires_at && session.expires_at * 1000 <= Date.now()) {
      localStorage.removeItem(sessionKey);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(sessionKey);
    return null;
  }
}

export function getStoredUser() {
  return readSession()?.user || null;
}

export async function signIn({ email, password }) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, password })
  });
  const session = await parseResponse(response);
  storeSession(session);
  return { user: session.user, session };
}

export async function signUp({ name, email, password }) {
  const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, password, data: { full_name: name } })
  });
  const data = await parseResponse(response);
  const session = data.access_token ? data : data.session;
  if (session) storeSession(session);
  return { user: data.user || session?.user || null, session: session || null };
}

export async function signOut() {
  const session = readSession();
  localStorage.removeItem(sessionKey);
  if (!session?.access_token || !isAuthConfigured()) return;

  await fetch(`${supabaseUrl}/auth/v1/logout`, {
    method: 'POST',
    headers: authHeaders(session.access_token)
  }).catch(() => undefined);
}
