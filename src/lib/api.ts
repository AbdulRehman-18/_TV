const API_URL = 'http://localhost:8000/api';

// ─── Token Management ────────────────────────────────────────────────────────
function getTokens() {
  const access = localStorage.getItem('access_token');
  const refresh = localStorage.getItem('refresh_token');
  return { access, refresh };
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}



// ─── Token Refresh Logic ─────────────────────────────────────────────────────
async function refreshAccessToken(): Promise<string | null> {
  const { refresh } = getTokens();
  if (!refresh) return null;

  try {
    const response = await fetch(`${API_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!response.ok) {
      clearTokens();
      return null;
    }
    const data = await response.json();
    setTokens(data.access, data.refresh || refresh);
    return data.access;
  } catch {
    clearTokens();
    return null;
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  const { access } = getTokens();
  if (access) {
    headers.set('Authorization', `Bearer ${access}`);
  }

  let response = await fetch(url, { ...options, headers });

  // If 401, try refreshing the token
  if (response.status === 401) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      headers.set('Authorization', `Bearer ${newAccess}`);
      response = await fetch(url, { ...options, headers });
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
    return response.json();
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
    async login(credentials: { username: string; password: string }) {
      const response = await fetch(`${API_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.non_field_errors?.[0] || error.detail || 'Login failed');
      }
      const data = await response.json();
      setTokens(data.tokens.access, data.tokens.refresh);
      return data;
    },

    async register(userData: {
      username: string;
      email: string;
      password: string;
      password_confirm: string;
      role: 'admin' | 'client';
      organization?: string;
      phone?: string;
    }) {
      const response = await fetch(`${API_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(JSON.stringify(error));
      }
      const data = await response.json();
      setTokens(data.tokens.access, data.tokens.refresh);
      return data;
    },

    async getMe() {
      const response = await fetchWithAuth(`${API_URL}/auth/me/`);
      if (!response.ok) return null;
      return response.json();
    },

    logout() {
      clearTokens();
    },

    isLoggedIn(): boolean {
      return !!getTokens().access;
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
