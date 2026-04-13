const TOKEN_KEY = "land_registry_token";
const ROLE_KEY = "land_registry_role";

export function getAuth() {
  return {
    token: localStorage.getItem(TOKEN_KEY) ?? "",
    role: localStorage.getItem(ROLE_KEY) ?? "",
  };
}

export function setAuth(token, role) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}
