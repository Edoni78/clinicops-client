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
  Doctor: "Mjek",
  Nurse: "Infermier",
  LabTechnician: "Teknikian laboratori",
  ClinicAdmin: "Administrator",
};

export function getClinicUserRoleLabel(role) {
  if (!role) return "—";
  return ROLE_LABELS[role] ?? role;
}
