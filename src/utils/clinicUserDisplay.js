/**
 * Primary label for a clinic staff user (name first, email fallback).
 */
export function getClinicUserDisplayName(user) {
  if (!user) return "—";
  const name =
    user.displayName ??
    user.DisplayName ??
    user.doctorDisplayName ??
    user.DoctorDisplayName ??
    user.fullName ??
    user.FullName ??
    user.name ??
    user.Name;
  if (name && String(name).trim()) return String(name).trim();
  return user.email ?? user.Email ?? "—";
}

export function getClinicUserEmail(user) {
  if (!user) return "—";
  return user.email ?? user.Email ?? "—";
}

const ROLE_LABELS = {
  doctor: "Mjek",
  nurse: "Infermier",
  labtechnician: "Teknik laboratori",
  labtech: "Teknik laboratori",
  lab: "Teknik laboratori",
  clinicadmin: "Administrator",
  admin: "Administrator",
  superadmin: "Superadmin",
};

export function getClinicUserRoleLabel(role) {
  if (!role) return "—";
  const key = String(role).toLowerCase().replace(/[\s_-]/g, "");
  return ROLE_LABELS[key] ?? String(role);
}
