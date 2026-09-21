import React from "react";
import EmrVitalsGrid from "./EmrVitalsGrid";
import EmrClinicalBlock from "./EmrClinicalBlock";
import Drawer from "../ui/Drawer";
import { fmtEmrDate, getCaseStatusBadgeClass } from "../../utils/emrDisplay";

export default function EmrConsultDetailModal({ consult, doctorName, onClose, title = "Detajet e konsultës" }) {
  if (!consult) return null;
  const statusClass = getCaseStatusBadgeClass(consult.caseStatus);

  return (
    <Drawer
      open
      onClose={onClose}
      title={title}
      subtitle={fmtEmrDate(consult.consultDate)}
      widthClass="max-w-lg"
      labelledBy="emr-consult-modal-title"
    >
      <p className="text-sm text-slate-700 mb-2">
        Mjeku: <span className="font-medium">{doctorName || "—"}</span>
      </p>
      <span className={`inline-flex mb-4 items-center px-1.5 py-0.5 rounded-md text-[11px] font-medium border ${statusClass}`}>
        {consult.caseStatus || "—"}
      </span>
      <div className="space-y-4">
        <EmrClinicalBlock consult={consult} showNotes />
        {Array.isArray(consult.vitals) && consult.vitals.length > 0 && (
          <EmrVitalsGrid vitals={consult.vitals} compact />
        )}
      </div>
    </Drawer>
  );
}
