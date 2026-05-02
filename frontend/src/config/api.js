/** Backend origin. Browser uses host machine ports when using Docker (e.g. localhost:5000). */
export const API_BASE =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:5000";

export const TOKEN_KEY = "devops_dashboard_token";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
