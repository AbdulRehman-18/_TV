const API_URL = 'http://localhost:8000/api';

export const api = {
  async get(endpoint: string) {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, { headers });
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  },

  async post(endpoint: string, data: Record<string, unknown>) {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  },

  async upload(endpoint: string, formData: FormData) {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
    // Note: Do NOT set Content-Type header when sending FormData; browser sets it with boundary
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  },

  async patch(endpoint: string, data: Record<string, unknown>) {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  },

  async delete(endpoint: string) {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error(response.statusText);
    return true;
  },

  auth: {
    async login(credentials: { username: string; password: string }) {
      const response = await fetch(`${API_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) throw new Error('Login failed');
      const data = await response.json();
      localStorage.setItem('auth_token', data.token);
      return data;
    },
    logout() {
      localStorage.removeItem('auth_token');
    },
    getUser() {
      const token = localStorage.getItem('auth_token');
      if (!token) return null;
      // In a real app, you'd fetch the user profile. 
      // For now, we'll return a dummy user if token exists.
      return { token };
    }
  }
};
