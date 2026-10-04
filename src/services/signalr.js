/**
 * Realtime updates are delivered by Supabase in SignalRContext.
 * This module remains so older imports do not pull in the previous hub client.
 */
export const SIGNALR_RECONNECT_DELAYS_MS = [0, 1000, 2000, 5000, 10000, 30000];

export async function createClinicHubConnection() {
  throw new Error("Realtime uses Supabase, not the previous clinic hub.");
}

export async function joinClinic() {}

export async function joinPatientCase() {}
