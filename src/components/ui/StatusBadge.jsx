import React from "react";
import { getCaseStatusLabel, normalizeCaseStatus } from "../../pages/Dashboard/Cases/caseStatus";

const STATUS_CLASS = {
  Waiting: "bg-amber-50 text-amber-900 border-amber-200",
  InProgress: "bg-sky-50 text-sky-900 border-sky-200",
  InConsultation: "bg-sky-50 text-sky-900 border-sky-200",
  Completed: "bg-slate-100 text-slate-600 border-slate-200",
  Finished: "bg-indigo-50 text-indigo-900 border-indigo-200",
  Mbyllur: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function StatusBadge({ status, className = "" }) {
  const key = normalizeCaseStatus(status);
  const tone = STATUS_CLASS[key] || "bg-slate-50 text-slate-700 border-slate-200";
  return (
    <span className={`status-pill ${tone} ${className}`}>
      {getCaseStatusLabel(status)}
    </span>
  );
}

export function statusBadgeClass(status) {
  const key = normalizeCaseStatus(status);
  return STATUS_CLASS[key] || "bg-slate-50 text-slate-700 border-slate-200";
}
