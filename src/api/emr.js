import axios from "axios";
import api from "./axios";

function normalizeBool(value) {
  return value ? "true" : "false";
}

export async function getPatientEmr(patientId, doctorView = false) {
  if (!patientId) throw new Error("patientId is required");
  const { data } = await api.get(`/api/Patient/${patientId}/emr`, {
    params: { doctorView: normalizeBool(doctorView) },
  });
  return data;
}

export async function getPatientEmrPublic(patientId) {
  if (!patientId) throw new Error("patientId is required");
  // Try authenticated request first (works when clinic user opens public link while logged in).
  try {
    const { data } = await api.get(`/api/Patient/${patientId}/emr`, {
      params: { doctorView: "false" },
    });
    return data;
  } catch {
    // Fallback for anonymous/public access.
  }
  const baseURL = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/$/, "");
  const { data } = await axios.get(`${baseURL}/api/Patient/${patientId}/emr`, {
    params: { doctorView: "false" },
  });
  return data;
}
