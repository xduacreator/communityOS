export function getToken() {
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem("latihclub_token") ||
      localStorage.getItem("communityos_token")
    );
  }
  return null;
}

export function clearLegacyToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("latihclub_token");
    localStorage.removeItem("communityos_token");
  }
}

export function removeToken() {
  if (typeof window !== "undefined") {
    clearLegacyToken();
    void fetch("/api/auth/logout", { method: "POST" });
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
