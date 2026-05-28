import React from "react";
import { FiSearch } from "react-icons/fi";

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "PatientViewed", label: "PatientViewed" },
  { value: "PatientCreated", label: "PatientCreated" },
  { value: "PatientUpdated", label: "PatientUpdated" },
  { value: "PatientDeleted", label: "PatientDeleted" },
  { value: "PatientAnonymized", label: "PatientAnonymized" },
  { value: "PatientExported", label: "PatientExported" },
  { value: "MedicalRecordViewed", label: "MedicalRecordViewed" },
  { value: "MedicalRecordUpdated", label: "MedicalRecordUpdated" },
  { value: "Login", label: "Login" },
  { value: "Logout", label: "Logout" },
];

const ENTITY_OPTIONS = [
  { value: "", label: "All entities" },
  { value: "Patient", label: "Patient" },
  { value: "MedicalRecord", label: "MedicalRecord" },
  { value: "Appointment", label: "Appointment" },
  { value: "Visit", label: "Visit" },
  { value: "File", label: "File" },
  { value: "User", label: "User" },
];

export default function AuditLogFilters({
  draftFilters,
  onDraftChange,
  onApply,
  onClear,
  loading,
}) {
  return (
    <div className="card p-4 sm:p-5 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 items-end">
        <div className="xl:col-span-2">
          <label className="label">Search</label>
          <div className="input-icon-wrap">
            <FiSearch className="input-icon" size={18} />
            <input
              type="search"
              className="input-with-icon"
              value={draftFilters.search}
              onChange={(e) => onDraftChange("search", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onApply();
              }}
              placeholder="Patient or user name..."
            />
          </div>
        </div>

        <div>
          <label className="label">Action</label>
          <select
            className="input"
            value={draftFilters.action}
            onChange={(e) => onDraftChange("action", e.target.value)}
          >
            {ACTION_OPTIONS.map((item) => (
              <option key={item.value || "all-actions"} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Entity</label>
          <select
            className="input"
            value={draftFilters.entityName}
            onChange={(e) => onDraftChange("entityName", e.target.value)}
          >
            {ENTITY_OPTIONS.map((item) => (
              <option key={item.value || "all-entities"} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">From date</label>
          <input
            type="date"
            className="input"
            value={draftFilters.fromDate}
            onChange={(e) => onDraftChange("fromDate", e.target.value)}
          />
        </div>

        <div>
          <label className="label">To date</label>
          <input
            type="date"
            className="input"
            value={draftFilters.toDate}
            onChange={(e) => onDraftChange("toDate", e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button type="button" className="btn-primary btn-sm" onClick={onApply} disabled={loading}>
          Apply filters
        </button>
        <button type="button" className="btn-secondary btn-sm" onClick={onClear} disabled={loading}>
          Clear filters
        </button>
      </div>
    </div>
  );
}
