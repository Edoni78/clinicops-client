function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export const getJwtPayload = () => {
  const token = localStorage.getItem("accessToken");
  const payload = token ? decodeJwt(token) : null;
  const user = readStoredUser();
  if (!payload && !user) return null;
  return {
    ...(payload || {}),
    role: payload?.role ?? payload?.Role ?? user?.role ?? user?.Role ?? null,
    clinicId:
      payload?.clinicId ??
      payload?.ClinicId ??
      payload?.clinic_id ??
      user?.clinicId ??
      user?.ClinicId ??
      null,
    clinicMode: payload?.clinicMode ?? payload?.ClinicMode ?? user?.clinicMode ?? user?.ClinicMode ?? null,
    clinicName: payload?.clinicName ?? payload?.ClinicName ?? user?.clinicName ?? user?.ClinicName ?? null,
  };
};

/** Role claim from the session when the stored user omits role. */
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
