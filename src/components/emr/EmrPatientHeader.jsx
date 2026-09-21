import React from "react";
import { FiUser, FiPhone, FiCalendar, FiClock } from "react-icons/fi";
import {
  fmtEmrDate,
  fmtEmrDateOnly,
  getGenderLabel,
  getPatientInitials,
} from "../../utils/emrDisplay";

function InfoTile({ label, children, tabular }) {
  return (
    <div className="border border-slate-200 bg-white p-3 rounded-md">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
      <div className={`text-sm font-medium text-slate-900 ${tabular ? "tabular-nums font-mono text-xs" : ""}`}>
        {children}
      </div>
    </div>
  );
}

export default function EmrPatientHeader({
  emr,
  lastUpdated,
  showEmrId = true,
  variant = "default",
  className = "",
}) {
  const initials = getPatientInitials(emr.firstName, emr.lastName);

  return (
    <div className={`rounded-md overflow-hidden border border-slate-200 bg-white ${className}`}>
      <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-slate-900 text-white text-sm font-semibold">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            {variant === "public" ? "Kartela elektronike mjekësore" : "Kartela EMR"}
          </p>
          <h2 className="text-base font-semibold text-slate-900 truncate">
            {emr.firstName} {emr.lastName}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <FiUser size={12} />
              {getGenderLabel(emr.gender)}
            </span>
            {emr.phone && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <FiPhone size={12} />
                {emr.phone}
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 p-3 bg-slate-50">
        <InfoTile label="Përditësimi i fundit">
          <span className="inline-flex items-center gap-1">
            <FiClock size={12} className="text-slate-400" />
            {lastUpdated ? fmtEmrDate(lastUpdated) : "—"}
          </span>
        </InfoTile>
        <InfoTile label="Data e lindjes">
          <span className="inline-flex items-center gap-1 tabular-nums">
            <FiCalendar size={12} className="text-slate-400" />
            {fmtEmrDateOnly(emr.dateOfBirth)}
          </span>
        </InfoTile>
        <InfoTile label="Gjinia">{getGenderLabel(emr.gender)}</InfoTile>
        {showEmrId ? (
          <InfoTile label="ID pacientit" tabular>
            {emr.patientId || "—"}
          </InfoTile>
        ) : (
          <InfoTile label="Telefoni">
            <span className="tabular-nums">{emr.phone || "—"}</span>
          </InfoTile>
        )}
      </div>
    </div>
  );
}
