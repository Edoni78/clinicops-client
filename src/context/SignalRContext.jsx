import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import * as signalR from "@microsoft/signalr";
import {
  createClinicHubConnection,
  joinClinic,
  joinPatientCase,
} from "../services/signalr";
import { getClinicId } from "../utils/clinicId";
import { useAuth } from "./AuthContext";

const SignalRContext = createContext(null);

const CONNECT_RETRY_MS = 3000;
const MAX_CONNECT_RETRIES = 5;

export function SignalRProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [connection, setConnection] = useState(null);
  const [connectionState, setConnectionState] = useState("Disconnected");
  const [error, setError] = useState(null);
  const connectionRef = useRef(null);
  const connectingRef = useRef(false);
  const connectRetriesRef = useRef(0);
  const connectRetryTimerRef = useRef(null);
  const joinedCasesRef = useRef(new Set());

  useEffect(() => {
    connectionRef.current = connection;
  }, [connection]);

  const rejoinGroups = useCallback(async (conn) => {
    try {
      await joinClinic(conn, getClinicId());
      const caseIds = [...joinedCasesRef.current];
      await Promise.all(
        caseIds.map((caseId) =>
          joinPatientCase(conn, caseId).catch(() => {})
        )
      );
    } catch (e) {
      console.warn("SignalR group rejoin failed", e);
    }
  }, []);

  const subscribe = useCallback((eventName, handler) => {
    const conn = connectionRef.current;
    if (!conn) return () => {};
    conn.on(eventName, handler);
    return () => conn.off(eventName, handler);
  }, []);

  const stopConnection = useCallback(async () => {
    if (connectRetryTimerRef.current) {
      clearTimeout(connectRetryTimerRef.current);
      connectRetryTimerRef.current = null;
    }
    connectRetriesRef.current = 0;
    connectingRef.current = false;
    const conn = connectionRef.current;
    connectionRef.current = null;
    setConnection(null);
    setConnectionState("Disconnected");
    if (conn) {
      try {
        await conn.stop();
      } catch {
        /* ignore */
      }
    }
  }, []);

  const connect = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token || connectingRef.current) return;

    const existing = connectionRef.current;
    if (
      existing &&
      (existing.state === signalR.HubConnectionState.Connected ||
        existing.state === signalR.HubConnectionState.Connecting ||
        existing.state === signalR.HubConnectionState.Reconnecting)
    ) {
      return;
    }

    if (existing) {
      try {
        await existing.stop();
      } catch {
        /* ignore */
      }
      connectionRef.current = null;
      setConnection(null);
    }

    connectingRef.current = true;
    setConnectionState("Connecting");
    setError(null);

    try {
      const conn = await createClinicHubConnection();
      await rejoinGroups(conn);

      conn.onclose(() => {
        setConnectionState("Disconnected");
        if (connectionRef.current === conn) {
          connectionRef.current = null;
          setConnection(null);
        }
      });
      conn.onreconnecting(() => setConnectionState("Connecting"));
      conn.onreconnected(async () => {
        setConnectionState("Connected");
        connectRetriesRef.current = 0;
        await rejoinGroups(conn);
      });

      connectionRef.current = conn;
      setConnection(conn);
      setConnectionState("Connected");
      connectRetriesRef.current = 0;
    } catch (err) {
      setError(err?.message || "Failed to connect");
      setConnectionState("Disconnected");

      if (
        isAuthenticated &&
        connectRetriesRef.current < MAX_CONNECT_RETRIES
      ) {
        connectRetriesRef.current += 1;
        connectRetryTimerRef.current = window.setTimeout(() => {
          connectRetryTimerRef.current = null;
          connectingRef.current = false;
          connect();
        }, CONNECT_RETRY_MS);
        return;
      }
    } finally {
      if (!connectRetryTimerRef.current) {
        connectingRef.current = false;
      }
    }
  }, [isAuthenticated, rejoinGroups]);

  const joinCase = useCallback(async (patientCaseId) => {
    if (!patientCaseId) return;
    joinedCasesRef.current.add(patientCaseId);
    const conn = connectionRef.current;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;
    try {
      await joinPatientCase(conn, patientCaseId);
    } catch (e) {
      console.warn("JoinPatientCase failed", e);
    }
  }, []);

  const connectRef = useRef(connect);
  connectRef.current = connect;

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      stopConnection();
      joinedCasesRef.current.clear();
      return;
    }

    connectRef.current();

    return () => {
      stopConnection();
    };
  }, [isAuthenticated, authLoading, stopConnection]);

  const onVitalsUpdated = useCallback(
    (handler) => subscribe("VitalsUpdated", handler),
    [subscribe]
  );
  const onReportUpdated = useCallback(
    (handler) => subscribe("ReportUpdated", handler),
    [subscribe]
  );
  const onCaseStatusChanged = useCallback(
    (handler) => subscribe("CaseStatusChanged", handler),
    [subscribe]
  );

  const value = useMemo(
    () => ({
      connection,
      connectionState,
      error,
      connect,
      joinCase,
      onVitalsUpdated,
      onReportUpdated,
      onCaseStatusChanged,
    }),
    [
      connection,
      connectionState,
      error,
      connect,
      joinCase,
      onVitalsUpdated,
      onReportUpdated,
      onCaseStatusChanged,
    ]
  );

  return (
    <SignalRContext.Provider value={value}>{children}</SignalRContext.Provider>
  );
}

export const useSignalR = () => useContext(SignalRContext);
