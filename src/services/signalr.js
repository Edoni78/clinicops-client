import * as signalR from "@microsoft/signalr";
import { getClinicId } from "../utils/clinicId";

/** Faster reconnect: immediate first retry, then backoff. */
export const SIGNALR_RECONNECT_DELAYS_MS = [0, 1000, 2000, 5000, 10000, 30000];

const getHubUrl = () => {
  const base = process.env.REACT_APP_API_BASE_URL || "";
  return base.replace(/\/$/, "") + "/hubs/clinic";
};

function getAccessToken() {
  const token = localStorage.getItem("accessToken");
  if (!token) return "";
  return token.startsWith("Bearer ") ? token.slice(7) : token;
}

/**
 * Create and start SignalR connection to clinic hub.
 * Auth: JWT via accessTokenFactory (refreshed on each HTTP request).
 * @returns {Promise<signalR.HubConnection>}
 */
export async function createClinicHubConnection() {
  const url = getHubUrl();
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(url, {
      accessTokenFactory: getAccessToken,
      // Prefer WebSocket; keep fallbacks so corporate networks still work.
      transport:
        signalR.HttpTransportType.WebSockets |
        signalR.HttpTransportType.ServerSentEvents |
        signalR.HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect(SIGNALR_RECONNECT_DELAYS_MS)
    .configureLogging(
      process.env.NODE_ENV === "production"
        ? signalR.LogLevel.Warning
        : signalR.LogLevel.Information
    )
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
  if (!id) return;
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
