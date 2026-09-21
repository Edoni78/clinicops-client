import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiFolder, FiSearch, FiUsers } from "react-icons/fi";
import { listPatients } from "../../api/patient";
import { getPatientCases } from "../../api/patientCase";
import { useAuth } from "../../context/AuthContext";
import { useDashboardPanel } from "../../context/DashboardPanelContext";
import { getSidebarMenuItems } from "../../utils/dashboardMenu";
import { normalizeCaseStatus } from "../../pages/Dashboard/Cases/caseStatus";

function isMacPlatform() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");
}

export function getSearchShortcutLabel() {
  return isMacPlatform() ? "⌘K" : "Ctrl+K";
}

function patientId(p) {
  return p?.id ?? p?.patientId ?? p?.Id;
}

function patientName(p) {
  return `${p?.firstName ?? p?.FirstName ?? ""} ${p?.lastName ?? p?.LastName ?? ""}`.trim();
}

function caseId(c) {
  return c?.id ?? c?.Id;
}

function caseName(c) {
  return `${c?.patientFirstName ?? c?.PatientFirstName ?? ""} ${c?.patientLastName ?? c?.PatientLastName ?? ""}`.trim();
}

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { activePanel, roleLower } = useDashboardPanel();
  const hasClinic = !!(user?.clinicId ?? user?.ClinicId);
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const menuItems = useMemo(
    () => getSidebarMenuItems({ roleLower: roleLower || String(role || "").toLowerCase(), activePanel, hasClinic }),
    [roleLower, role, activePanel, hasClinic]
  );
  const allowedPaths = useMemo(() => new Set(menuItems.map((i) => i.path)), [menuItems]);
  const canPatients = allowedPaths.has("/dashboard/patients-list") || allowedPaths.has("/dashboard/patients");
  const canCases = allowedPaths.has("/dashboard/cases");

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 20);
    let cancelled = false;
    setLoading(true);
    Promise.all([
      canPatients ? listPatients().catch(() => []) : Promise.resolve([]),
      canCases ? getPatientCases().catch(() => []) : Promise.resolve([]),
    ])
      .then(([p, c]) => {
        if (cancelled) return;
        setPatients(Array.isArray(p) ? p : []);
        setCases(Array.isArray(c) ? c : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [open, canPatients, canCases]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = [];

    menuItems.forEach((item) => {
      if (!q || item.label.toLowerCase().includes(q)) {
        items.push({ type: "nav", id: `nav-${item.path}`, label: item.label, hint: "Menu", path: item.path });
      }
    });

    if (q) {
      if (canPatients) {
        patients
          .filter((p) => {
            const name = patientName(p).toLowerCase();
            const phone = String(p.phone ?? p.Phone ?? "").toLowerCase();
            const id = String(patientId(p) || "").toLowerCase();
            return name.includes(q) || phone.includes(q) || id.includes(q);
          })
          .slice(0, 8)
          .forEach((p) => {
            items.push({
              type: "patient",
              id: `p-${patientId(p)}`,
              label: patientName(p) || "Pacient",
              hint: p.phone ?? p.Phone ?? "Pacient",
              path: "/dashboard/patients-list",
            });
          });
      }
      if (canCases) {
        cases
          .filter((c) => {
            const name = caseName(c).toLowerCase();
            const id = String(caseId(c) || "").toLowerCase();
            return name.includes(q) || id.includes(q);
          })
          .slice(0, 8)
          .forEach((c) => {
            const status = normalizeCaseStatus(c.status ?? c.Status);
            const id = caseId(c);
            const roleL = String(role || "").toLowerCase();
            let path = `/dashboard/cases/${id}`;
            if (roleL === "doctor") path = `/dashboard/cases/${id}/doctor`;
            else if (roleL === "nurse") path = `/dashboard/cases/${id}/nurse`;
            items.push({
              type: "case",
              id: `c-${id}`,
              label: caseName(c) || "Rast",
              hint: status,
              path,
            });
          });
      }
    }

    return items.slice(0, 20);
  }, [query, menuItems, patients, cases, canPatients, canCases, role]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, results.length]);

  const go = useCallback(
    (item) => {
      if (!item) return;
      onClose();
      navigate(item.path);
    },
    [navigate, onClose]
  );

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Kërkim global">
      <button type="button" className="drawer-overlay" onClick={onClose} aria-label="Mbyll kërkimin" />
      <div className="relative z-[71] mx-auto mt-[12vh] w-full max-w-lg px-3">
        <div className="bg-white border border-slate-200 rounded-md shadow-card-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200">
            <FiSearch className="text-slate-400 shrink-0" size={16} aria-hidden />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Kërko pacientë, raste ose faqe…"
              className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none py-1.5"
              aria-label="Kërkim"
            />
            <kbd className="kbd">Esc</kbd>
          </div>
          <ul className="max-h-[min(24rem,50vh)] overflow-y-auto py-1" role="listbox">
            {loading && results.length === 0 ? (
              <li className="px-3 py-4 text-xs text-slate-500">Duke kërkuar…</li>
            ) : results.length === 0 ? (
              <li className="px-3 py-4 text-xs text-slate-500">Nuk u gjet asnjë rezultat.</li>
            ) : (
              results.map((item, idx) => (
                <li key={item.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={idx === activeIndex}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm ${
                      idx === activeIndex ? "bg-slate-50" : "hover:bg-slate-50"
                    }`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => go(item)}
                  >
                    {item.type === "patient" ? (
                      <FiUsers size={14} className="text-slate-400 shrink-0" />
                    ) : item.type === "case" ? (
                      <FiFolder size={14} className="text-slate-400 shrink-0" />
                    ) : (
                      <FiSearch size={14} className="text-slate-400 shrink-0" />
                    )}
                    <span className="flex-1 truncate text-slate-900">{item.label}</span>
                    <span className="text-[11px] text-slate-500 shrink-0">{item.hint}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
