import axios from "axios";
import api from "./axios";

const baseURL = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/$/, "");

/**
 * Get doctor profile. Only for users with role Doctor (403 otherwise).
 * GET /api/DoctorProfile/profile
 * @returns {Promise<{ userId, email, displayName, signatureUrl, stampUrl }>}
 */
export async function getDoctorProfile() {
  const { data } = await api.get("/api/DoctorProfile/profile");
  return data;
}

/**
 * Update doctor display name.
 * PUT /api/DoctorProfile/profile
 * @param {{ displayName?: string }} body - max 200 chars
 * @returns {Promise<DoctorProfileDto>}
 */
export async function updateDoctorProfile(body) {
  const payload = {};
  if (body.displayName != null) payload.displayName = body.displayName;
  const { data } = await api.put("/api/DoctorProfile/profile", payload);
  return data;
}

/**
 * Upload signature image. multipart/form-data, field name "file".
 * POST /api/DoctorProfile/profile/signature
 * @param {File} file - image (jpg, jpeg, png, gif, webp)
 * @returns {Promise<DoctorProfileDto>}
 */
export async function uploadDoctorSignature(file) {
  const formData = new FormData();
  formData.append("file", file);
  const token = localStorage.getItem("accessToken");
  const cleanToken = token?.startsWith("Bearer ") ? token.slice(7) : token;
  const { data } = await axios.post(`${baseURL}/api/DoctorProfile/profile/signature`, formData, {
    headers: cleanToken ? { Authorization: `Bearer ${cleanToken}` } : {},
  });
  return data;
}

/**
 * Upload stamp image. multipart/form-data, field name "file".
 * POST /api/DoctorProfile/profile/stamp
 * @param {File} file - image (jpg, jpeg, png, gif, webp)
 * @returns {Promise<DoctorProfileDto>}
 */
export async function uploadDoctorStamp(file) {
  const formData = new FormData();
  formData.append("file", file);
  const token = localStorage.getItem("accessToken");
  const cleanToken = token?.startsWith("Bearer ") ? token.slice(7) : token;
  const { data } = await axios.post(`${baseURL}/api/DoctorProfile/profile/stamp`, formData, {
    headers: cleanToken ? { Authorization: `Bearer ${cleanToken}` } : {},
  });
  return data;
}

/**
 * Full URL for signature or stamp image (API returns e.g. /uploads/doctors/xxx/signature.png).
 */
export function getDoctorImageFullUrl(url) {
  if (!url) return null;
  return baseURL + (url.startsWith("/") ? url : "/" + url);
}

/**
 * Fetch doctor signature or stamp image as base64 data URL (for PDF embedding).
 * Uses api so the request includes the Bearer token.
 * @param {string} imagePath - Path from API (e.g. /uploads/doctors/xxx/signature.png)
 * @returns {Promise<string|null>}
 */
export async function getDoctorImageAsBase64(imagePath) {
  if (!imagePath) return null;
  const path = imagePath.startsWith("/") ? imagePath : "/" + imagePath;
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
