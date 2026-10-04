import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { getClinicId } from "../utils/clinicId";
import { useAuth } from "./AuthContext";

const SignalRContext = createContext(null);

const CONNECT_RETRY_MS = 3000;
const MAX_CONNECT_RETRIES = 5;

function emit(handlers, eventName, ...args) {
  const set = handlers.current[eventName];
  if (!set) return;
  set.forEach((handler) => {
    try {
      handler(...args);
    } catch (err) {
      console.warn(eventName, err);
    }
  });
}

export function SignalRProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [connection, setConnection] = useState(null);
  const [connectionState, setConnectionState] = useState("Disconnected");
  const [error, setError] = useState(null);
  const connectionRef = useRef(null);
  const channelRef = useRef(null);
  const connectingRef = useRef(false);
  const connectRetriesRef = useRef(0);
  const connectRetryTimerRef = useRef(null);
  const handlersRef = useRef({
    VitalsUpdated: new Set(),
    ReportUpdated: new Set(),
    CaseStatusChanged: new Set(),
  });

  const stopConnection = useCallback(async () => {
    if (connectRetryTimerRef.current) {
      clearTimeout(connectRetryTimerRef.current);
      connectRetryTimerRef.current = null;
    }
    connectRetriesRef.current = 0;
    connectingRef.current = false;
    const channel = channelRef.current;
    channelRef.current = null;
    connectionRef.current = null;
    setConnection(null);
    setConnectionState("Disconnected");
    if (channel) {
      try {
        await supabase.removeChannel(channel);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const connect = useCallback(async () => {
    if (!isAuthenticated || connectingRef.current) return;
    if (channelRef.current) return;

    const clinicId = getClinicId();
    if (!clinicId) return;

    connectingRef.current = true;
    setConnectionState("Connecting");
    setError(null);

    const channel = supabase
      .channel(`clinic-${clinicId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "patient_cases", filter: `clinic_id=eq.${clinicId}` },
        (payload) => {
          const next = payload.new || {};
          const prev = payload.old || {};
          if (next.id && next.status && next.status !== prev.status) {
            emit(handlersRef, "CaseStatusChanged", next.id, next.status);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "case_vitals", filter: `clinic_id=eq.${clinicId}` },
        (payload) => {
          const row = payload.new || {};
          emit(handlersRef, "VitalsUpdated", row.patient_case_id, {
            weightKg: row.weight_kg,
            systolicPressure: row.systolic_pressure,
            diastolicPressure: row.diastolic_pressure,
            temperatureC: row.temperature_c,
            heartRate: row.heart_rate,
            recordedAt: row.recorded_at,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "medical_reports", filter: `clinic_id=eq.${clinicId}` },
        (payload) => {
          const row = payload.new || payload.old || {};
          if (payload.eventType === "DELETE") {
            emit(handlersRef, "ReportUpdated", row.patient_case_id, null);
            return;
          }
          emit(handlersRef, "ReportUpdated", row.patient_case_id, {
            anamneza: row.anamneza ?? "",
            ekzaminimi: row.ekzaminimi ?? "",
            diagnosis: row.diagnosis ?? "",
            therapy: row.therapy ?? "",
          });
        }
      );

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        const handle = { state: "Connected" };
        channelRef.current = channel;
        connectionRef.current = handle;
        setConnection(handle);
        setConnectionState("Connected");
        setError(null);
        connectRetriesRef.current = 0;
        connectingRef.current = false;
        return;
      }
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        setConnectionState("Disconnected");
        setConnection(null);
        connectionRef.current = null;
        if (channelRef.current === channel) channelRef.current = null;
        connectingRef.current = false;
        if (status !== "CLOSED" && isAuthenticated && connectRetriesRef.current < MAX_CONNECT_RETRIES) {
          connectRetriesRef.current += 1;
          setError("Failed to connect");
          connectRetryTimerRef.current = window.setTimeout(() => {
            connectRetryTimerRef.current = null;
            supabase.removeChannel(channel).catch(() => {});
            connect();
          }, CONNECT_RETRY_MS);
        }
      }
    });
  }, [isAuthenticated]);

  const subscribe = useCallback((eventName, handler) => {
    const set = handlersRef.current[eventName];
    if (!set) return () => {};
    set.add(handler);
    return () => set.delete(handler);
  }, []);

  const joinCase = useCallback(async () => {
    // Clinic-wide realtime already delivers case events.
  }, []);

  const connectRef = useRef(connect);
  connectRef.current = connect;

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      stopConnection();
      return undefined;
    }
    connectRef.current();
    return () => {
      stopConnection();
    };
  }, [isAuthenticated, authLoading, stopConnection]);

  const onVitalsUpdated = useCallback((handler) => subscribe("VitalsUpdated", handler), [subscribe]);
  const onReportUpdated = useCallback((handler) => subscribe("ReportUpdated", handler), [subscribe]);
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
    [connection, connectionState, error, connect, joinCase, onVitalsUpdated, onReportUpdated, onCaseStatusChanged]
  );

  return <SignalRContext.Provider value={value}>{children}</SignalRContext.Provider>;
}

export const useSignalR = () => useContext(SignalRContext);
