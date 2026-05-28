export const getJwtPayload = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

/** Role claim from JWT when user object omits role (common after older sessions). */
export function getRoleFromJwt() {
  const p = getJwtPayload();
  if (!p) return null;
  const raw =
    p.role ??
    p.Role ??
    p["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
}
