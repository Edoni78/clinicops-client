import { supabase } from "../lib/supabaseClient";
import { apiError, throwIfError } from "../lib/apiError";
import {
  clearProfileCache,
  fetchCurrentProfile,
  mapProfileToUser,
  persistAccessToken,
} from "../lib/sessionUser";
import { CLINIC_MODE_SOLO_DOCTOR } from "../utils/clinicMode";
import { recordAudit } from "./auditService";

function authPayload(session, profile) {
  const user = mapProfileToUser(profile);
  return {
    accessToken: session.access_token,
    expiresAtUtc: session.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : null,
    user,
  };
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(email || "").trim(),
    password: password || "",
  });
  if (error) throwIfError(error, "Email ose fjalëkalim i pasaktë.");
  if (!data?.session) throw apiError("Email ose fjalëkalim i pasaktë.", 401);

  clearProfileCache();
  const profile = await fetchCurrentProfile(true);
  if (!profile?.role || !profile.is_active) {
    await supabase.auth.signOut();
    clearProfileCache();
    throw apiError(
      "Aplikimi juaj është ende në pritje të aprovimit. Do të mund të hyni pasi të aprovohet.",
      403
    );
  }

  try {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === "aal2" && aal?.currentLevel !== "aal2") {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factor = (factors?.totp || []).find((item) => item.status === "verified");
      if (factor?.id) {
        return { requiresMfa: true, mfaTicket: factor.id };
      }
    }
  } catch {
    // MFA is optional until it is enabled for the Supabase project.
  }

  persistAccessToken(data.session);
  const payload = authPayload(data.session, profile);
  await recordAudit({
    action: "Login",
    entityName: "User",
    entityId: profile.id,
    entityDisplayName: profile.display_name || profile.email,
    description: "Login",
    clinicId: profile.clinic_id,
  });
  return payload;
}

export async function applyForClinic(clinicName, email, password, clinicMode) {
  const mode =
    clinicMode === CLINIC_MODE_SOLO_DOCTOR || clinicMode === 0 || clinicMode === "0"
      ? "SoloDoctor"
      : "FullTeam";
  const { data, error } = await supabase.rpc("submit_clinic_application", {
    p_clinic_name: String(clinicName || "").trim(),
    p_email: String(email || "").trim(),
    p_password: password || "",
    p_clinic_mode: mode,
  });
  throwIfError(error, "Aplikimi dështoi. Provoni përsëri.");
  return { id: data };
}

export async function setupMfa() {
  const { data: listed, error: listError } = await supabase.auth.mfa.listFactors();
  throwIfError(listError, "MFA setup failed.");
  const verified = (listed?.totp || []).filter((item) => item.status === "verified");
  if (verified.length > 0) {
    throw apiError("MFA is already enabled for this account.");
  }
  for (const factor of listed?.totp || []) {
    if (factor.status !== "verified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Google Authenticator",
  });
  throwIfError(error, "MFA setup failed.");
  const uri = data?.totp?.uri || data?.totp?.qr_code || "";
  if (!uri) throw apiError("MFA setup response did not include qrCodeUri.");
  return { qrCodeUri: uri, factorId: data.id };
}

function randomRecoveryCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const raw = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function enableMfa(code) {
  const { data: listed, error: listError } = await supabase.auth.mfa.listFactors();
  throwIfError(listError, "Could not enable MFA.");
  const factor =
    (listed?.totp || []).find((item) => item.status === "unverified") ||
    (listed?.all || []).find((item) => item.factor_type === "totp" && item.status !== "verified");
  if (!factor?.id) throw apiError("Start MFA setup again before entering a code.");

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: factor.id,
  });
  throwIfError(challengeError, "Could not enable MFA.");
  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId: factor.id,
    challengeId: challenge.id,
    code: String(code || "").trim(),
  });
  throwIfError(verifyError, "Could not enable MFA. Please verify the code and try again.");

  const codes = Array.from({ length: 8 }, () => randomRecoveryCode());
  const profile = await fetchCurrentProfile(true);
  if (profile?.id) {
    const rows = await Promise.all(
      codes.map(async (value) => ({
        user_id: profile.id,
        code_hash: await sha256(value),
      }))
    );
    await supabase.from("mfa_recovery_codes").delete().eq("user_id", profile.id);
    await supabase.from("mfa_recovery_codes").insert(rows);
  }
  return { recoveryCodes: codes };
}

export async function verifyMfaLogin(mfaTicket, code) {
  if (!mfaTicket) throw apiError("MFA ticket missing. Please login again.");
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: mfaTicket,
  });
  throwIfError(challengeError, "Invalid authenticator code.");
  const { data, error } = await supabase.auth.mfa.verify({
    factorId: mfaTicket,
    challengeId: challenge.id,
    code: String(code || "").trim(),
  });
  throwIfError(error, "Invalid authenticator code.");

  clearProfileCache();
  const profile = await fetchCurrentProfile(true);
  const session = data?.session || (await supabase.auth.getSession()).data.session;
  if (!session || !profile) throw apiError("Invalid login response.", 401);
  persistAccessToken(session);
  const payload = authPayload(session, profile);
  await recordAudit({
    action: "Login",
    entityName: "User",
    entityId: profile.id,
    entityDisplayName: profile.display_name || profile.email,
    description: "Login",
    clinicId: profile.clinic_id,
  });
  return payload;
}

export async function logout() {
  await recordAudit({
    action: "Logout",
    entityName: "User",
    description: "Logout",
  });
  clearProfileCache();
  await supabase.auth.signOut();
}
