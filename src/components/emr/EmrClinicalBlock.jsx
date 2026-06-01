import React from "react";
import { FiClipboard, FiFileText, FiCheckCircle, FiMessageSquare } from "react-icons/fi";

const SECTIONS = [
  {
    key: "anamneza",
    label: "Anamneza",
    icon: FiFileText,
    accent: "border-l-violet-500 bg-violet-50/40",
    iconBg: "bg-violet-100 text-violet-700",
  },
  {
    key: "diagnosis",
    label: "Diagnoza",
    icon: FiClipboard,
    accent: "border-l-clinic-600 bg-clinic-50/50",
    iconBg: "bg-clinic-100 text-clinic-700",
  },
  {
    key: "therapy",
    label: "Terapia / Rekomandimi",
    icon: FiCheckCircle,
    accent: "border-l-emerald-500 bg-emerald-50/40",
    iconBg: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "notes",
    label: "Shënime klinike",
    icon: FiMessageSquare,
    accent: "border-l-slate-400 bg-slate-50",
    iconBg: "bg-slate-100 text-slate-600",
  },
];

export default function EmrClinicalBlock({ consult, showNotes = true, showEmpty = false }) {
  const entries = SECTIONS.filter((s) => {
    if (s.key === "notes" && !showNotes) return false;
    const val = consult?.[s.key];
    return showEmpty || (val && String(val).trim());
  });

  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      {entries.map((section) => {
        const Icon = section.icon;
        const text = consult?.[section.key];
        const display = text && String(text).trim() ? text : showEmpty ? "—" : null;
        if (!display) return null;
        return (
          <div
            key={section.key}
            className={`rounded-xl border border-slate-200/80 border-l-4 pl-0 overflow-hidden ${section.accent}`}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200/50 bg-white/60">
              <span
                className={`inline-flex items-center justify-center h-10 w-10 rounded-lg shrink-0 ${section.iconBg}`}
              >
                <Icon size={20} strokeWidth={2} />
              </span>
              <h4 className="text-sm font-semibold text-slate-900">{section.label}</h4>
            </div>
            <div className="px-4 py-4 bg-white">
              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{display}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
