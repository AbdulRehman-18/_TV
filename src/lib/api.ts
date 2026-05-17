const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, unknown>;
};

function formatApiErrors(errors: Record<string, unknown> | undefined): string {
  if (!errors) return '';
  const parts: string[] = [];
  for (const [, value] of Object.entries(errors)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') parts.push(item);
      }
      continue;
    }
    if (typeof value === 'string') {
      parts.push(value);
      continue;
    }
    if (value && typeof value === 'object') {
      // Flatten common DRF shapes like {field: ["msg"]}
      for (const nested of Object.values(value as Record<string, unknown>)) {
        if (Array.isArray(nested)) {
          for (const item of nested) {
            if (typeof item === 'string') parts.push(item);
          }
        } else if (typeof nested === 'string') {
          parts.push(nested);
        }
      }
    }
    if (parts.length >= 6) break;
  }
  return parts.join(' ');
}

async function readJsonSafe<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function normalizeGetResponse(payload: unknown) {
  if (Array.isArray(payload)) return payload;

  if (payload && typeof payload === 'object') {
    const objectPayload = payload as Record<string, unknown>;

    if (Array.isArray(objectPayload.results)) {
      return objectPayload.results;
    }

    if ('data' in objectPayload) {
      return objectPayload.data;
    }
  }

  return payload;
}

type RawUser = {
  id: string | number;
  email: string;
  full_name?: string;
  is_admin?: boolean;
  is_verified?: boolean;
  date_joined?: string;
};

function normalizeUser(user: RawUser | null | undefined) {
  if (!user || typeof user !== 'object') return null;
  const isAdmin = Boolean(user.is_admin);
  return {
    ...user,
    role: isAdmin ? 'admin' : 'client',
    username: user.full_name || user.email,
  };
}

// ─── Token Management ────────────────────────────────────────────────────────
// Access token is kept in memory only.
// Refresh token is stored in an httpOnly cookie set by the server — never
// readable by JavaScript — so it is not managed here at all.
let _accessToken: string | null = null;

// Tracks whether the user has an active session so isLoggedIn() works across
// page reloads without exposing the refresh token to JS.
const SESSION_FLAG = 'has_session';

function setTokens(access: string) {
  _accessToken = access;
  sessionStorage.setItem(SESSION_FLAG, '1');
}

function clearTokens() {
  _accessToken = null;
  sessionStorage.removeItem(SESSION_FLAG);
}



// ─── Token Refresh Logic ─────────────────────────────────────────────────────
async function refreshAccessToken(): Promise<string | null> {
  try {
    // The httpOnly refresh cookie is sent automatically by the browser.
    const response = await fetch(`${API_URL}/auth/token/refresh/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      clearTokens();
      return null;
    }
    const envelope = await readJsonSafe<ApiEnvelope<{ tokens: { access: string } }>>(response);
    const tokens = envelope?.data?.tokens;
    if (!tokens?.access) {
      clearTokens();
      return null;
    }
    setTokens(tokens.access);
    return tokens.access;
  } catch {
    clearTokens();
    return null;
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  let token = _accessToken;

  if (!token) {
    token = await refreshAccessToken();
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers, credentials: 'include' });

  // If 401, try refreshing the token once
  if (response.status === 401) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      headers.set('Authorization', `Bearer ${newAccess}`);
      response = await fetch(url, { ...options, headers, credentials: 'include' });
    }
  }

  return response;
}

// ─── Core API Methods ────────────────────────────────────────────────────────
export const api = {
  async get(endpoint: string) {
    const response = await fetchWithAuth(`${API_URL}${endpoint}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`API GET Error [${endpoint}]:`, errorData);
      throw new Error(JSON.stringify(errorData) || response.statusText);
    }
    const payload = await response.json();
    return normalizeGetResponse(payload);
  },

  async post(endpoint: string, data: Record<string, unknown>) {
    const response = await fetchWithAuth(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`API POST Error [${endpoint}]:`, errorData);
      throw new Error(JSON.stringify(errorData) || response.statusText);
    }
    return response.json();
  },

  async upload(endpoint: string, formData: FormData) {
    // Don't set Content-Type — browser sets it with boundary for FormData
    const response = await fetchWithAuth(`${API_URL}${endpoint}`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`API UPLOAD Error [${endpoint}]:`, errorData);
      throw new Error(JSON.stringify(errorData) || response.statusText);
    }
    return response.json();
  },

  async put(endpoint: string, data: Record<string, unknown>) {
    const response = await fetchWithAuth(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  },

  async patch(endpoint: string, data: Record<string, unknown>) {
    const response = await fetchWithAuth(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`API PATCH Error [${endpoint}]:`, errorData);
      throw new Error(JSON.stringify(errorData) || response.statusText);
    }
    return response.json();
  },

  async patchUpload(endpoint: string, formData: FormData) {
    const response = await fetchWithAuth(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`API PATCH_UPLOAD Error [${endpoint}]:`, errorData);
      throw new Error(JSON.stringify(errorData) || response.statusText);
    }
    return response.json();
  },

  async delete(endpoint: string) {
    const response = await fetchWithAuth(`${API_URL}${endpoint}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(response.statusText);
    return true;
  },

  // ─── Auth ────────────────────────────────────────────────────────────────
  auth: {
    async login(credentials: { email: string; password: string }) {
      const response = await fetch(`${API_URL}/auth/login/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        const error = await readJsonSafe<ApiEnvelope<unknown>>(response);
        const details = formatApiErrors((error?.errors as Record<string, unknown>) || undefined);
        throw new Error(details || error?.message || 'Login failed');
      }
      const envelope = await readJsonSafe<ApiEnvelope<{ tokens: { access: string }; user: RawUser }>>(response);
      const tokens = envelope?.data?.tokens;
      if (!tokens?.access) {
        throw new Error('Login failed: missing access token in response');
      }
      setTokens(tokens.access);
      return envelope;
    },

    async register(userData: {
      full_name: string;
      email: string;
      password: string;
      confirm_password: string;
    }) {
      const response = await fetch(`${API_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const error = await readJsonSafe<ApiEnvelope<unknown>>(response);
        const details = formatApiErrors((error?.errors as Record<string, unknown>) || undefined);
        throw new Error(details || error?.message || 'Registration failed');
      }
      const envelope = await readJsonSafe<ApiEnvelope<{ email: string; full_name: string }>>(response);
      return envelope;
    },

    async verifyEmail(params: { uid: string; token: string }) {
      const url = new URL(`${API_URL}/auth/verify-email/`);
      url.searchParams.set('uid', params.uid);
      url.searchParams.set('token', params.token);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const envelope = await readJsonSafe<ApiEnvelope<unknown>>(response);
      if (!response.ok) {
        const details = formatApiErrors((envelope?.errors as Record<string, unknown>) || undefined);
        throw new Error(details || envelope?.message || 'Email verification failed');
      }
      return envelope;
    },

    async getMe() {
      const response = await fetchWithAuth(`${API_URL}/auth/me/`);
      if (!response.ok) return null;
      const envelope = await readJsonSafe<ApiEnvelope<RawUser | null>>(response);
      return normalizeUser(envelope?.data) ?? null;
    },

    logout() {
      clearTokens();
    },

    async forgotPassword(email: string) {
      const response = await fetch(`${API_URL}/auth/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const envelope = await readJsonSafe<ApiEnvelope<unknown>>(response);
      if (!response.ok) {
        throw new Error(envelope?.message || 'Failed to send reset email');
      }
      return envelope;
    },

    async resetPassword(data: { uid: string; token: string; password: string; confirm_password: string }) {
      const response = await fetch(`${API_URL}/auth/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const envelope = await readJsonSafe<ApiEnvelope<unknown>>(response);
      if (!response.ok) {
        const details = formatApiErrors((envelope?.errors as Record<string, unknown>) || undefined);
        throw new Error(details || envelope?.message || 'Password reset failed');
      }
      return envelope;
    },

    isLoggedIn(): boolean {
      return !!(_accessToken || sessionStorage.getItem(SESSION_FLAG));
    },
  },

  // ─── Schedule ────────────────────────────────────────────────────────────
  schedule: {
    async getActive() {
      const response = await fetch(`${API_URL}/schedule/active/`);
      if (!response.ok) throw new Error(response.statusText);
      return response.json();
    },
  },
};
