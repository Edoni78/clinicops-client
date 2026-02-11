import * as signalR from "@microsoft/signalr";
import { getClinicId } from "../utils/clinicId";

const getHubUrl = () => {
  const base = process.env.REACT_APP_API_BASE_URL || "";
  return base.replace(/\/$/, "") + "/hubs/clinic";
};

/**
 * Create and start SignalR connection to clinic hub.
 * Auth: access_token in query or Bearer in headers (SignalR uses query for WS).
 * @returns {Promise<signalR.HubConnection>}
 */
export async function createClinicHubConnection() {
  const token = localStorage.getItem("accessToken");
  const cleanToken = token?.startsWith("Bearer ") ? token.slice(7) : token;
  const url = getHubUrl();
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(url, {
      accessTokenFactory: () => cleanToken || "",
    })
    .withAutomaticReconnect()
    .build();

  await connection.start();
  return connection;
}

/**
 * Join clinic group so we receive events for this clinic.
 * @param {signalR.HubConnection} connection
 * @param {string} [clinicId] - defaults to getClinicId()
 */
export async function joinClinic(connection, clinicId) {
  const id = clinicId || getClinicId();
  await connection.invoke("JoinClinic", id);
}

/**
 * Optionally join a single case room for targeted updates.
 * @param {signalR.HubConnection} connection
 * @param {string} patientCaseId
 */
export async function joinPatientCase(connection, patientCaseId) {
  if (!patientCaseId) return;
  await connection.invoke("JoinPatientCase", patientCaseId);
}
