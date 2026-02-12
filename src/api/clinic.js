import axios from "axios";
import api from "./axios";

/**
 * Get the logged-in clinic's profile (only for clinic users; SuperAdmin gets 400).
 * GET /api/Clinic/profile
 * @returns {Promise<{ id, name, address, phone, logoUrl, description, createdAt, isActive }>}
 */
export async function getClinicProfile() {
  const { data } = await api.get("/api/Clinic/profile");
  return data;
}

/**
 * Update the logged-in clinic's profile.
 * PUT /api/Clinic/profile
 * @param {{ name?: string, address?: string, phone?: string, logoUrl?: string, description?: string }} body
 */
export async function updateClinicProfile(body) {
  const payload = {};
  if (body.name != null) payload.Name = body.name;
  if (body.address != null) payload.Address = body.address;
  if (body.phone != null) payload.Phone = body.phone;
  if (body.logoUrl != null) payload.LogoUrl = body.logoUrl;
  if (body.description != null) payload.Description = body.description;
  const { data } = await api.put("/api/Clinic/profile", payload);
  return data;
}

/**
 * Upload clinic logo (multipart/form-data). Backend expects field name "file".
 * POST /api/Clinic/profile/logo
 * @param {File} file - image file (jpg, jpeg, png, gif, webp)
 * @returns {Promise<ClinicProfileDto>} updated profile with new logoUrl
 */
export async function uploadClinicLogo(file) {
  const formData = new FormData();
  formData.append("file", file);
  const baseURL = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/$/, "");
  const token = localStorage.getItem("accessToken");
  const cleanToken = token?.startsWith("Bearer ") ? token.slice(7) : token;
  const { data } = await axios.post(`${baseURL}/api/Clinic/profile/logo`, formData, {
    headers: cleanToken ? { Authorization: `Bearer ${cleanToken}` } : {},
  });
  return data;
}

/**
 * Build full URL for logo (logoUrl from API is e.g. /uploads/clinics/xxx/logo.png).
 */
export function getLogoFullUrl(logoUrl) {
  if (!logoUrl) return null;
  const base = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/$/, "");
  return base + (logoUrl.startsWith("/") ? logoUrl : "/" + logoUrl);
}

/**
 * Fetch clinic logo as base64 data URL using authenticated API (for PDF embedding).
 * Uses the same axios instance as the rest of the app so the request includes the Bearer token.
 * @param {string} logoUrl - Path from API (e.g. /uploads/clinics/xxx/logo.png)
 * @returns {Promise<string|null>}
 */
export async function getLogoAsBase64(logoUrl) {
  if (!logoUrl) return null;
  const path = logoUrl.startsWith("/") ? logoUrl : "/" + logoUrl;
  try {
    const { data } = await api.get(path, { responseType: "blob" });
    if (!data || !(data instanceof Blob)) return null;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(data);
    });
  } catch {
    return null;
  }
}
