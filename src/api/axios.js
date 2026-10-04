/**
 * The demo no longer calls the previous HTTP API.
 * A few screens still import this module for GET /api/Patient; those calls
 * are served from Supabase. Any other path is rejected so the old backend
 * cannot be contacted by accident.
 */
import { listPatients } from "../services/patientService";

function unsupported(method, url) {
  const error = new Error(`This demo does not call the previous backend (${method} ${url}).`);
  error.response = { status: 410, data: { message: error.message } };
  return Promise.reject(error);
}

const api = {
  get(url) {
    const path = String(url || "");
    if (path === "/api/Patient") {
      return listPatients().then((data) => ({ data }));
    }
    return unsupported("GET", path);
  },
  post(url) {
    return unsupported("POST", url);
  },
  put(url) {
    return unsupported("PUT", url);
  },
  patch(url) {
    return unsupported("PATCH", url);
  },
  delete(url) {
    return unsupported("DELETE", url);
  },
};

export default api;
