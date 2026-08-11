const API_BASE = '/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('fundsroom_token');
};

export const setAuthToken = (token: string) => {
  localStorage.setItem('fundsroom_token', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('fundsroom_token');
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'An error occurred during API request.');
  }

  return data;
};
