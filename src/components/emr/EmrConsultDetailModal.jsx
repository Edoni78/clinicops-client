import React from "react";
import { FiX, FiLayers } from "react-icons/fi";
import EmrVitalsGrid from "./EmrVitalsGrid";
import EmrClinicalBlock from "./EmrClinicalBlock";
import { fmtEmrDate, getCaseStatusBadgeClass } from "../../utils/emrDisplay";

export default function EmrConsultDetailModal({ consult, doctorName, onClose, title = "Detajet e konsultës" }) {
  if (!consult) return null;
  const statusClass = getCaseStatusBadgeClass(consult.caseStatus);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emr-consult-modal-title"
    >
      <div className="card w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-card-lg border-0 sm:border overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-5 sm:px-7 py-5 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-clinic-50/30 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <span className="inline-flex shrink-0 items-center justify-center h-12 w-12 rounded-xl bg-clinic-600 text-white">
              <FiLayers size={24} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h3 id="emr-consult-modal-title" className="text-lg sm:text-xl font-semibold text-slate-900">
                {title}
              </h3>
              <p className="text-sm text-slate-600 mt-0.5">{fmtEmrDate(consult.consultDate)}</p>
              <p className="text-sm text-slate-700 mt-1">
                Mjeku: <span className="font-medium">{doctorName || "—"}</span>
              </p>
              <span
                className={`inline-flex mt-2 items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusClass}`}
              >
                {consult.caseStatus || "—"}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-ghost shrink-0 rounded-xl p-2.5"
            onClick={onClose}
            aria-label="Mbyll"
          >
            <FiX size={22} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 sm:px-7 py-5 sm:py-6 space-y-5">
          <EmrClinicalBlock consult={consult} showNotes />
          {Array.isArray(consult.vitals) && consult.vitals.length > 0 && (
            <EmrVitalsGrid vitals={consult.vitals} compact />
          )}
        </div>
      </div>
    </div>
  );
}
