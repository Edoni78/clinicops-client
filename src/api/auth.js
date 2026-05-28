import api from "./axios";
import {
  CLINIC_MODE_SOLO_DOCTOR,
  CLINIC_MODE_FULL_TEAM,
} from "../utils/clinicMode";

/**
 * Login – POST /api/auth/login or /api/Auth/login
 * Body: { email, password }
 * Response: { accessToken, expiresAtUtc?, user: { id, email, clinicId, clinicName, role } }
 */
export async function login(email, password) {
  const { data } = await api.post("/api/Auth/login", { email, password });
  return data;
}

/**
 * Apply for clinic (public, no auth) – POST /api/auth/apply or /api/Auth/apply
 * Body: { clinicName, email, password, clinicMode }
 */
export async function applyForClinic(clinicName, email, password, clinicMode) {
  // Backend enum binding commonly expects numeric values unless
  // JsonStringEnumConverter is configured server-side.
  const clinicModeValue =
    clinicMode === CLINIC_MODE_SOLO_DOCTOR ? 0 : 1;

  const { data } = await api.post("/api/Auth/apply", {
    clinicName,
    email,
    password,
    clinicMode: clinicModeValue,
  });
  return data;
}

/**
 * Start MFA setup for the authenticated user.
 * POST /api/auth/mfa/setup
 */
export async function setupMfa() {
  const { data } = await api.post("/api/auth/mfa/setup");
  return data;
}

/**
 * Enable MFA using a TOTP code from authenticator app.
 * POST /api/auth/mfa/enable
 * Body: { code }
 */
export async function enableMfa(code) {
  const { data } = await api.post("/api/auth/mfa/enable", { code });
  return data;
}

/**
 * Verify MFA challenge for login and return full auth payload.
 * POST /api/auth/mfa/verify-login
 * Body: { mfaTicket, code }
 */
export async function verifyMfaLogin(mfaTicket, code) {
  const { data } = await api.post("/api/auth/mfa/verify-login", {
    mfaTicket,
    code,
  });
  return data;
}
