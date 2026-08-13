export function setToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('latihclub_token', token);
    localStorage.setItem('communityos_token', token);
  }
}

export function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('latihclub_token') || localStorage.getItem('communityos_token');
  }
  return null;
}

export function removeToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('latihclub_token');
    localStorage.removeItem('communityos_token');
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
