/**
 * Shape errors like the previous API client so existing screens can keep
 * reading err.response.data.message.
 */
export function apiError(message, status = 400) {
  const err = new Error(message || "Diçka shkoi keq. Provoni përsëri.");
  err.response = { status, data: { message: err.message } };
  return err;
}

export function throwIfError(error, fallback = "Veprimi dështoi. Provoni përsëri.") {
  if (!error) return;
  const raw = error.message || error.details || fallback;
  let message = raw;
  const code = error.code || "";
  if (code === "23505") {
    if (/protocol/i.test(raw) || /patient_cases_protocol/i.test(raw)) {
      message = "Numri i protokollit ekziston tashmë në këtë klinikë.";
    } else if (/email/i.test(raw) || /users/i.test(raw)) {
      message = "Ky email është tashmë i regjistruar.";
    } else {
      message = "Ky regjistrim ekziston tashmë.";
    }
  } else if (code === "42501" || /row-level security/i.test(raw) || /permission/i.test(raw)) {
    message = "Nuk keni leje për këtë veprim.";
  } else if (code === "PGRST301" || /jwt/i.test(raw)) {
    message = "Sesioni ka skaduar. Hyni përsëri.";
  } else if (/Failed to fetch|NetworkError|network/i.test(raw)) {
    message = "Nuk u arrit lidhja me serverin. Kontrolloni internetin dhe provoni përsëri.";
  } else if (/Invalid login credentials/i.test(raw)) {
    message = "Email ose fjalëkalim i pasaktë.";
  }
  const status = code === "PGRST116" ? 404 : code === "42501" ? 403 : 400;
  throw apiError(message, status);
}
