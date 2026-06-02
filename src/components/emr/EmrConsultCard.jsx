import React from "react";
import {
  FiUser,
  FiCalendar,
  FiChevronRight,
  FiChevronDown,
  FiClock,
} from "react-icons/fi";
import EmrVitalsGrid from "./EmrVitalsGrid";
import EmrClinicalBlock from "./EmrClinicalBlock";
import { fmtEmrDate, getCaseStatusBadgeClass } from "../../utils/emrDisplay";

export default function EmrConsultCard({
  consult,
  doctorName,
  variant = "full",
  onSelect,
  selected = false,
  actions,
  showMeta = true,
  collapsible = false,
  expanded = true,
  onToggle,
}) {
  const isTimeline = variant === "timeline";
  const isCollapsed = collapsible && !expanded;
  const statusClass = getCaseStatusBadgeClass(consult.caseStatus);

  const headerRow = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <span className="inline-flex shrink-0 items-center justify-center h-11 w-11 rounded-xl bg-clinic-100 text-clinic-700 mt-0.5">
          <FiCalendar size={22} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold text-slate-900">
            Konsulta · {fmtEmrDate(consult.consultDate)}
          </p>
          <p className="text-sm text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <FiUser size={16} className="text-slate-400" />
              <span className="font-medium text-slate-800">{doctorName || "—"}</span>
            </span>
          </p>
          {(isTimeline || isCollapsed) && consult.diagnosis && (
            <p className="text-sm text-slate-600 mt-2 line-clamp-2">{consult.diagnosis}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusClass}`}>
          {consult.caseStatus || "—"}
        </span>
        {isTimeline && onSelect && (
          <FiChevronRight size={22} className="text-slate-400" aria-hidden />
        )}
        {collapsible && onToggle && (
          <span
            className={`inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 text-slate-500 transition-transform duration-200 ${
              expanded ? "rotate-180 bg-clinic-50 border-clinic-200 text-clinic-700" : "bg-slate-50"
            }`}
            aria-hidden
          >
            <FiChevronDown size={20} />
          </span>
        )}
      </div>
    </div>
  );

  const details = (
    <>
      <div className="mt-5">
        <EmrClinicalBlock consult={consult} showNotes />
      </div>
      {Array.isArray(consult.vitals) && consult.vitals.length > 0 && (
        <div className="mt-5">
          <EmrVitalsGrid vitals={consult.vitals} compact />
        </div>
      )}
      {showMeta && (consult.reportCreatedAt || consult.doctorUserId) && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          {consult.reportCreatedAt && (
            <span className="inline-flex items-center gap-1">
              <FiClock size={14} />
              Raporti: {fmtEmrDate(consult.reportCreatedAt)}
            </span>
          )}
        </div>
      )}
      {actions && <div className="mt-5 pt-4 border-t border-slate-100">{actions}</div>}
    </>
  );

  const cardClass = `rounded-2xl border bg-white transition-all duration-200 ${
    selected
      ? "border-clinic-300 ring-2 ring-clinic-500/20 shadow-card-md"
      : "border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow-card-md"
  } p-5 sm:p-6`;

  if (isTimeline && onSelect) {
    return (
      <button type="button" onClick={() => onSelect(consult)} className={`w-full text-left ${cardClass}`}>
        {headerRow}
      </button>
    );
  }

  if (collapsible && onToggle) {
    return (
      <article className={cardClass}>
        <button
          type="button"
          onClick={onToggle}
          className="w-full text-left rounded-xl -m-1 p-1 hover:bg-slate-50/80 transition-colors"
          aria-expanded={expanded}
        >
          {headerRow}
        </button>
        {isCollapsed && actions && (
          <div className="mt-4 pt-3 border-t border-slate-100">{actions}</div>
        )}
        {expanded && details}
      </article>
    );
  }

  return (
    <article className={cardClass}>
      {headerRow}
      {!isTimeline && details}
    </article>
  );
}
