import React from "react";
import { FiHash, FiSave } from "react-icons/fi";
import {
  isProtocolRequired,
  parseProtocolPreferences,
} from "../../../../utils/protocolPreferences";

export default function CaseProtocolSection({
  protocolPreferences,
  protocolNumber,
  protocolInput,
  setProtocolInput,
  canEdit,
  protocolSubmitting,
  onSave,
  caseFinished,
}) {
  const prefs = parseProtocolPreferences(protocolPreferences);
  if (!prefs.useProtocolNumber) return null;

  const required = isProtocolRequired(prefs);
  const displayNumber = (protocolNumber || "").trim();
  const missing = required && !displayNumber;

  return (
    <div className="card mb-6 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/60">
        <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2 flex-wrap">
          <FiHash className="text-clinic-600" size={15} aria-hidden />
          Numri i protokollit
          {required && (
            <span className="text-[10px] font-semibold normal-case text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              I detyrueshëm për mbyllje
            </span>
          )}
        </h2>
      </div>
      <div className="px-5 py-4">
        {canEdit && !caseFinished ? (
          <form onSubmit={onSave} className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1 min-w-0">
              <label htmlFor="case-protocol" className="label">
                Numri i protokollit
              </label>
              <input
                id="case-protocol"
                type="text"
                maxLength={100}
                value={protocolInput}
                onChange={(e) => setProtocolInput(e.target.value)}
                className="input"
                placeholder="p.sh. 2026/0142"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Unik për klinikën. Mund të përdorni çdo format (shifra, shkronja, etj.).
              </p>
            </div>
            <button
              type="submit"
              disabled={protocolSubmitting || !protocolInput.trim()}
              className="btn-primary btn-md shrink-0"
            >
              <FiSave size={16} aria-hidden />
              {protocolSubmitting ? "Duke ruajtur…" : "Ruaj numrin"}
            </button>
          </form>
        ) : (
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Numri aktual
            </p>
            <p
              className={`mt-1 text-sm font-semibold ${
                missing ? "text-amber-700" : "text-slate-900"
              }`}
            >
              {displayNumber || (required ? "Nuk është vendosur ende" : "—")}
            </p>
          </div>
        )}
        {missing && (
          <p className="text-xs text-amber-700 mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
            Vendosni numrin e protokollit para se të mbyllni rastin.
          </p>
        )}
      </div>
    </div>
  );
}
