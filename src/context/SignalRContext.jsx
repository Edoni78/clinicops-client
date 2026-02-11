import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  createClinicHubConnection,
  joinClinic,
  joinPatientCase,
} from "../services/signalr";
import { getClinicId } from "../utils/clinicId";

const SignalRContext = createContext(null);

export function SignalRProvider({ children }) {
  const [connection, setConnection] = useState(null);
  const [connectionState, setConnectionState] = useState("Disconnected"); // Disconnected | Connecting | Connected
  const [error, setError] = useState(null);
  const connectionRef = useRef(null);

  useEffect(() => {
    connectionRef.current = connection;
  }, [connection]);

  const connect = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    setConnectionState("Connecting");
    setError(null);
    try {
      const conn = await createClinicHubConnection();
      await joinClinic(conn, getClinicId());
      setConnection(conn);
      setConnectionState("Connected");

      conn.onclose(() => setConnectionState("Disconnected"));
      conn.onreconnecting(() => setConnectionState("Connecting"));
      conn.onreconnected(() => setConnectionState("Connected"));
    } catch (err) {
      setError(err?.message || "Failed to connect");
      setConnectionState("Disconnected");
    }
  }, []);

  const joinCase = useCallback(
    async (patientCaseId) => {
      if (connection && patientCaseId) {
        try {
          await joinPatientCase(connection, patientCaseId);
        } catch (e) {
          console.warn("JoinPatientCase failed", e);
        }
      }
    },
    [connection]
  );

  useEffect(() => {
    connect();
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const value = {
    connection,
    connectionState,
    error,
    connect,
    joinCase,
    onVitalsUpdated: (handler) => {
      if (!connection) return () => {};
      connection.on("VitalsUpdated", handler);
      return () => connection.off("VitalsUpdated");
    },
    onReportUpdated: (handler) => {
      if (!connection) return () => {};
      connection.on("ReportUpdated", handler);
      return () => connection.off("ReportUpdated");
    },
    onCaseStatusChanged: (handler) => {
      if (!connection) return () => {};
      connection.on("CaseStatusChanged", handler);
      return () => connection.off("CaseStatusChanged");
    },
  };

  return (
    <SignalRContext.Provider value={value}>
      {children}
    </SignalRContext.Provider>
  );
}

export const useSignalR = () => useContext(SignalRContext);
