import React from "react";
import { FiActivity, FiHeart, FiThermometer, FiDroplet } from "react-icons/fi";
import { fmtEmrDate, normalizeVital } from "../../utils/emrDisplay";

const VITAL_ITEMS = [
  {
    key: "heartRate",
    label: "Rrahjet e zemrës",
    unit: "bpm",
    icon: FiHeart,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    border: "border-rose-100/80",
    format: (v) => (v?.heartRate != null ? String(v.heartRate) : "—"),
  },
  {
    key: "bp",
    label: "Presioni",
    unit: "mmHg",
    icon: FiActivity,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
    border: "border-sky-100/80",
    format: (v) => {
      const sys = v?.systolicPressure;
      const dia = v?.diastolicPressure;
      if (sys == null && dia == null) return "—";
      return `${sys ?? "—"}/${dia ?? "—"}`;
    },
  },
  {
    key: "temp",
    label: "Temperatura",
    unit: "°C",
    icon: FiThermometer,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    border: "border-amber-100/80",
    format: (v) => (v?.temperatureC != null ? String(v.temperatureC) : "—"),
  },
  {
    key: "weight",
    label: "Pesha",
    unit: "kg",
    icon: FiDroplet,
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
    border: "border-teal-100/80",
    format: (v) => (v?.weightKg != null ? String(v.weightKg) : "—"),
  },
];

export default function EmrVitalsGrid({ vitals, recordedAtLabel, compact = false }) {
  const v = normalizeVital(Array.isArray(vitals) ? vitals[0] : vitals);
  if (!v) return null;

  const hasAny =
    v.heartRate != null ||
    v.systolicPressure != null ||
    v.diastolicPressure != null ||
    v.temperatureC != null ||
    v.weightKg != null;
  if (!hasAny) return null;

  return (
    <section
      className={`rounded-xl border border-slate-200/80 bg-slate-50/50 ${
        compact ? "p-3.5" : "p-4 sm:p-4"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-clinic-100 text-clinic-700">
            <FiActivity size={16} strokeWidth={2} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Shenjat vitale</h3>
            {v.recordedAt && (
              <p className="text-xs text-slate-500 mt-0.5">{fmtEmrDate(v.recordedAt)}</p>
            )}
          </div>
        </div>
        {recordedAtLabel && !v.recordedAt && (
          <span className="text-xs text-slate-500">{recordedAtLabel}</span>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {VITAL_ITEMS.map((item) => {
          const Icon = item.icon;
          const value = item.format(v);
          if (value === "—") return null;
          return (
            <div
              key={item.key}
              className={`rounded-lg border ${item.border} bg-white px-3 py-2.5`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`inline-flex shrink-0 items-center justify-center h-8 w-8 rounded-lg ${item.iconBg} ${item.iconColor}`}
                >
                  <Icon size={16} strokeWidth={2} />
                </span>
                <p className="text-xs font-medium text-slate-500 leading-snug truncate">
                  {item.label}
                </p>
              </div>
              <p className="text-lg font-semibold text-slate-900 tabular-nums leading-tight">
                {value}
                <span className="text-xs font-normal text-slate-400 ml-1">{item.unit}</span>
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
