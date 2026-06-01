export const ALLOWED_DOMAIN = "@jc-21.jp";
export const INVITE_CODE = "TGS-2026";

export function isAllowedDomain(email: string) {
  return email.toLowerCase().endsWith(ALLOWED_DOMAIN);
}

export function isAuthorized() {
  return localStorage.getItem("tgs-authorized") === "true";
}

export function authorize() {
  localStorage.setItem("tgs-authorized", "true");
}

export function logoutAuthorization() {
  localStorage.removeItem("tgs-authorized");
}