/** Default when API has no preferences yet (e.g. before migration). */
export const DEFAULT_VITAL_PREFERENCES = {
  enableWeight: true,
  enableBloodPressure: true,
  enableTemperature: true,
  enableHeartRate: true,
};

export function parseVitalPreferences(source) {
  const p = source?.vitalPreferences ?? source?.VitalPreferences ?? source ?? {};
  return {
    enableWeight: p.enableWeight ?? p.EnableWeight ?? true,
    enableBloodPressure: p.enableBloodPressure ?? p.EnableBloodPressure ?? true,
    enableTemperature: p.enableTemperature ?? p.EnableTemperature ?? true,
    enableHeartRate: p.enableHeartRate ?? p.EnableHeartRate ?? true,
  };
}

export function hasAnyVitalPreferenceEnabled(prefs) {
  const p = prefs || DEFAULT_VITAL_PREFERENCES;
  return (
    p.enableWeight || p.enableBloodPressure || p.enableTemperature || p.enableHeartRate
  );
}

export function buildVitalPreferencesPayload(prefs) {
  if (!prefs) return undefined;
  return {
    EnableWeight: !!prefs.enableWeight,
    EnableBloodPressure: !!prefs.enableBloodPressure,
    EnableTemperature: !!prefs.enableTemperature,
    EnableHeartRate: !!prefs.enableHeartRate,
  };
}

/** @returns {Record<string, number>|null} null if nothing to submit */
export function buildVitalsSubmitBody(formVitals, prefs) {
  const p = prefs || DEFAULT_VITAL_PREFERENCES;
  const body = {};

  if (p.enableWeight && formVitals.weightKg !== "" && formVitals.weightKg != null) {
    body.weightKg = Number(formVitals.weightKg);
  }
  if (p.enableBloodPressure) {
    if (formVitals.systolicPressure !== "" && formVitals.systolicPressure != null) {
      body.systolicPressure = Number(formVitals.systolicPressure);
    }
    if (formVitals.diastolicPressure !== "" && formVitals.diastolicPressure != null) {
      body.diastolicPressure = Number(formVitals.diastolicPressure);
    }
  }
  if (p.enableTemperature && formVitals.temperatureC !== "" && formVitals.temperatureC != null) {
    body.temperatureC = Number(formVitals.temperatureC);
  }
  if (p.enableHeartRate && formVitals.heartRate !== "" && formVitals.heartRate != null) {
    body.heartRate = Number(formVitals.heartRate);
  }

  if (Object.keys(body).length === 0) return null;
  return body;
}

export function hasRecordedVitals(vitals) {
  if (!vitals) return false;
  const w = vitals.weightKg ?? vitals.WeightKg;
  const sys = vitals.systolicPressure ?? vitals.SystolicPressure;
  const dia = vitals.diastolicPressure ?? vitals.DiastolicPressure;
  const temp = vitals.temperatureC ?? vitals.TemperatureC;
  const hr = vitals.heartRate ?? vitals.HeartRate;
  return w != null || sys != null || dia != null || temp != null || hr != null;
}

export const VITAL_DISPLAY_ROWS = [
  {
    key: "weight",
    prefKey: "enableWeight",
    label: "Pesha",
    format: (v) => {
      const val = v?.weightKg ?? v?.WeightKg;
      return val != null ? `${val} kg` : null;
    },
  },
  {
    key: "bp",
    prefKey: "enableBloodPressure",
    label: "Presioni",
    format: (v) => {
      const sys = v?.systolicPressure ?? v?.SystolicPressure;
      const dia = v?.diastolicPressure ?? v?.DiastolicPressure;
      if (sys == null && dia == null) return null;
      return `${sys ?? "—"} / ${dia ?? "—"}`;
    },
  },
  {
    key: "temp",
    prefKey: "enableTemperature",
    label: "Temperatura",
    format: (v) => {
      const val = v?.temperatureC ?? v?.TemperatureC;
      return val != null ? `${val} °C` : null;
    },
  },
  {
    key: "hr",
    prefKey: "enableHeartRate",
    label: "Rrahjet",
    format: (v) => {
      const val = v?.heartRate ?? v?.HeartRate;
      return val != null ? `${val} bpm` : null;
    },
  },
];

export function getRecordedVitalRows(vitals, prefs, { onlyRecorded = true } = {}) {
  const p = prefs || DEFAULT_VITAL_PREFERENCES;
  return VITAL_DISPLAY_ROWS.filter((row) => {
    if (!p[row.prefKey]) return false;
    const display = row.format(vitals);
    if (onlyRecorded) return display != null;
    return true;
  }).map((row) => ({
    ...row,
    value: row.format(vitals) ?? "—",
  }));
}
