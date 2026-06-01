import React from "react";
import { getRecordedVitalRows, hasRecordedVitals } from "../../utils/vitalPreferences";

export default function VitalsReadonlyGrid({ vitals, vitalPreferences, className = "" }) {
  if (!hasRecordedVitals(vitals)) return null;

  const rows = getRecordedVitalRows(vitals, vitalPreferences, { onlyRecorded: true });
  if (rows.length === 0) return null;

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 ${className}`}>
      {rows.map((row) => (
        <div
          key={row.key}
          className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2.5"
        >
          <p className="text-[10px] font-medium text-slate-500 uppercase">{row.label}</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900 tabular-nums">{row.value}</p>
        </div>
      ))}
    </div>
  );
}
