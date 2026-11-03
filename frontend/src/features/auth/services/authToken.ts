const tokenStorageKey = "tripcraft.accessToken";
export const authExpiredEvent = "tripcraft:auth-expired";

export function getAccessToken(): string | null {
  return typeof window === "undefined"
    ? null
    : window.sessionStorage.getItem(tokenStorageKey);
}

export function storeAccessToken(token: string): void {
  window.sessionStorage.setItem(tokenStorageKey, token);
}

export function clearAccessToken(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(tokenStorageKey);
  }
}
