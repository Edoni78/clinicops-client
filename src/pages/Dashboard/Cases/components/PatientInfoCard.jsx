import React from "react";
import { FiPhone, FiUser } from "react-icons/fi";
import { getCaseStatusLabel, normalizeCaseStatus } from "../caseStatus";

const STATUS_BADGE = {
  Waiting: "bg-amber-50 text-amber-800 border-amber-200",
  InProgress: "bg-blue-50 text-blue-800 border-blue-200",
  InConsultation: "bg-sky-50 text-sky-800 border-sky-200",
  Completed: "bg-indigo-50 text-indigo-800 border-indigo-200",
  Finished: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

export default function PatientInfoCard({
  patientDisplayName,
  patientGender,
  patientPhone,
  caseStatus,
  assignedDoctorName,
}) {
  const normalized = normalizeCaseStatus(caseStatus);
  const badgeClass = STATUS_BADGE[normalized] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-6 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <FiUser className="text-clinic-400" size={16} aria-hidden />
          Të dhënat e pacientit
        </h2>
        <span
          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-md border ${badgeClass}`}
        >
          {getCaseStatusLabel(caseStatus)}
        </span>
      </div>
      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
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
