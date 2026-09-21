import React from "react";
import { FiPhone } from "react-icons/fi";
import { getCaseStatusLabel, normalizeCaseStatus } from "../caseStatus";

const STATUS_BADGE = {
  Waiting: "bg-amber-50 text-amber-800 border-amber-200",
  InProgress: "bg-sky-50 text-sky-800 border-sky-200",
  InConsultation: "bg-sky-50 text-sky-800 border-sky-200",
  Completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Finished: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Mbyllur: "bg-slate-50 text-slate-700 border-slate-200",
};

export default function PatientInfoCard({
  patientDisplayName,
  patientGender,
  patientPhone,
  caseStatus,
  assignedDoctorName,
  protocolNumber,
}) {
  const normalized = normalizeCaseStatus(caseStatus);
  const badgeClass = STATUS_BADGE[normalized] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <div className="card mb-3 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
          Të dhënat e pacientit
        </h2>
        <span className={`badge border ${badgeClass}`}>
          {getCaseStatusLabel(caseStatus)}
        </span>
      </div>
      <div className="px-3 py-3 grid grid-cols-1 gap-3">
        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Emri</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{patientDisplayName}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Gjinia</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{patientGender}</p>
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1">
            <FiPhone size={12} aria-hidden />
            Telefoni
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900 tabular-nums">{patientPhone}</p>
        </div>
        {protocolNumber?.trim() && (
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Nr. protokollit</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 tabular-nums">{protocolNumber.trim()}</p>
          </div>
        )}
        {assignedDoctorName && (
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Mjeku përgjegjës</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{assignedDoctorName}</p>
          </div>
        )}
      </div>
    </div>
  );
}
