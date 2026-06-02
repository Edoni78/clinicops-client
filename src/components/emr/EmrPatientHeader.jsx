import React from "react";
import { FiUser, FiPhone, FiCalendar, FiHash, FiClock } from "react-icons/fi";
import {
  fmtEmrDate,
  fmtEmrDateOnly,
  getGenderLabel,
  getPatientInitials,
} from "../../utils/emrDisplay";

function InfoTile({ icon: Icon, label, children, accent }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent
          ? "border-clinic-200/80 bg-clinic-50/50"
          : "border-slate-200/80 bg-white/80 backdrop-blur-sm"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-white border border-slate-200/80 text-slate-600 shadow-sm">
          <Icon size={18} strokeWidth={2} />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      </div>
      <div className="text-sm font-semibold text-slate-900">{children}</div>
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
  const isPublic = variant === "public";

  return (
    <div className={`rounded-2xl overflow-hidden border border-slate-200/80 shadow-card-md ${className}`}>
      <div
        className={`px-5 sm:px-7 py-6 sm:py-7 ${
          isPublic
            ? "bg-gradient-to-r from-clinic-700 via-clinic-600 to-clinic-800"
            : "bg-gradient-to-r from-slate-800 via-slate-700 to-clinic-800"
        }`}
      >
        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
          <span className="inline-flex items-center justify-center h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] rounded-2xl bg-white/15 text-white text-xl sm:text-2xl font-bold border border-white/20 shadow-lg">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-white/70 mb-1">
              Kartela elektronike mjekësore
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {emr.firstName} {emr.lastName}
            </h2>
            <p className="text-sm text-white/80 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <FiUser size={16} />
                {getGenderLabel(emr.gender)}
              </span>
              {emr.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <FiPhone size={16} />
                  {emr.phone}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:p-5 bg-slate-50/80 border-t border-slate-200/60">
        <InfoTile icon={FiClock} label="Përditësimi i fundit">
          {lastUpdated ? fmtEmrDate(lastUpdated) : "—"}
        </InfoTile>
        <InfoTile icon={FiCalendar} label="Data e lindjes">
          {fmtEmrDateOnly(emr.dateOfBirth)}
        </InfoTile>
        <InfoTile icon={FiUser} label="Gjinia">
          {getGenderLabel(emr.gender)}
        </InfoTile>
        {showEmrId ? (
          <InfoTile icon={FiHash} label="ID pacientit" accent>
            <span className="font-mono text-clinic-700 break-all text-xs sm:text-sm">
              {emr.patientId || "—"}
            </span>
          </InfoTile>
        ) : (
          <InfoTile icon={FiPhone} label="Telefoni">
            {emr.phone || "—"}
          </InfoTile>
        )}
      </div>
    </div>
  );
}
