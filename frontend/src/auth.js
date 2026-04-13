const TOKEN_KEY = "land_registry_token";
const ROLE_KEY = "land_registry_role";
const WALLET_KEY = "land_registry_wallet";
const FULL_NAME_KEY = "land_registry_full_name";

export function getAuth() {
  return {
    token: localStorage.getItem(TOKEN_KEY) ?? "",
    role: localStorage.getItem(ROLE_KEY) ?? "",
    walletAddress: localStorage.getItem(WALLET_KEY) ?? "",
    fullName: localStorage.getItem(FULL_NAME_KEY) ?? "",
  };
}

export function setAuth(token, role, walletAddress = "", fullName = "") {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(WALLET_KEY, walletAddress ?? "");
  localStorage.setItem(FULL_NAME_KEY, fullName ?? "");
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(WALLET_KEY);
  localStorage.removeItem(FULL_NAME_KEY);
}
