import api from "./axios";

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
 * Body: { clinicName, email, password }
 */
export async function applyForClinic(clinicName, email, password) {
  const { data } = await api.post("/api/Auth/apply", {
    clinicName,
    email,
    password,
  });
  return data;
}
