import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiDollarSign,
  FiClock,
  FiCalendar,
  FiRefreshCw,
  FiX,
  FiSearch,
  FiPieChart,
  FiLayers,
} from "react-icons/fi";
import { getPatientCases, enrichPatientCasesWithService } from "../../../api/patientCase";
import { pickCaseServiceFields } from "../../../utils/caseServiceFields";
import {
  isSameDay,
  isYesterday,
  isInThisWeek,
  isSameCalendarDay,
  pad2,
  toYmdFromParts,
  normalizeStatusKey,
  caseMatchesNameQuery,
} from "../../../utils/caseListFilters";
import PageHeader from "../../../components/ui/PageHeader";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";

const DATE_FILTERS = [
  { value: "today", label: "Sot" },
  { value: "yesterday", label: "Dje" },
  { value: "week", label: "Këtë javë" },
  { value: "all", label: "Të gjitha" },
];

const STATUS_TABS = [
  { value: "all", label: "Të gjitha" },
  { value: "Completed", label: "Përfunduar" },
  { value: "Finished", label: "Mbyllur" },
];

const STATUS_LABELS = {
  Waiting: "Në pritje",
  InProgress: "Në progres",
  InConsultation: "Në konsultim",
  Completed: "Përfunduar",
  Finished: "Mbyllur",
};

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || "—";
}

function statusBadgeClass(status) {
  const map = {
    Waiting: "bg-amber-100 text-amber-800",
    InProgress: "bg-blue-100 text-blue-800",
    InConsultation: "bg-sky-100 text-sky-800",
    Completed: "bg-indigo-100 text-indigo-800",
    Finished: "bg-slate-100 text-slate-700",
  };
  return map[status] || "bg-gray-100 text-gray-800";
}

function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

function toPriceNumber(raw) {
  if (raw == null || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (Number.isNaN(n)) return null;
  return n;
}

function formatEUR(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${Number(n).toFixed(2)} EUR`;
}

function getServiceDisplay(c) {
  return pickCaseServiceFields(c).serviceName;
}

const selectDateClassName =
  "px-2.5 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-clinic-400/40 focus:border-clinic-400 outline-none min-w-[4.5rem]";

export default function Payments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState("all");
  const [dateFilter, setDateFilter] = useState("week");
  const [nameSearch, setNameSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [dateParts, setDateParts] = useState({ day: "", month: "", year: "" });
  const searchDate = useMemo(
    () => toYmdFromParts(dateParts.day, dateParts.month, dateParts.year),
    [dateParts.day, dateParts.month, dateParts.year]
  );

  const setDatePart = (key, raw) => {
    setDateParts((prev) => {
      const next = { ...prev, [key]: raw };
      if ((key === "month" || key === "year") && next.day && next.month) {
        const mi = parseInt(next.month, 10);
        if (mi >= 1 && mi <= 12) {
          const yi = next.year ? parseInt(next.year, 10) : 2004;
          const maxD = new Date(yi, mi, 0).getDate();
          const d0 = parseInt(next.day, 10);
          if (d0 > maxD) next.day = String(maxD);
        }
      }
      return next;
    });
  };

  const clearDateSearch = () => setDateParts({ day: "", month: "", year: "" });
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(
    () => Array.from({ length: 14 }, (_, i) => currentYear + 1 - i),
    [currentYear]
  );
  const maxDayInMonth = (() => {
    if (!dateParts.month) return 31;
    const mi = parseInt(dateParts.month, 10);
    if (mi < 1 || mi > 12) return 31;
    const yi = dateParts.year ? parseInt(dateParts.year, 10) : 2004;
    return new Date(yi, mi, 0).getDate();
  })();
  const dayOptions = useMemo(() => Array.from({ length: maxDayInMonth }, (_, i) => i + 1), [maxDayInMonth]);

  const fetchPaidCases = useCallback(async () => {
    setLoading(true);
    try {
      const [finished, completed] = await Promise.all([
        getPatientCases("Finished"),
        getPatientCases("Completed"),
      ]);
      const combined = [
        ...(Array.isArray(finished) ? finished : []),
        ...(Array.isArray(completed) ? completed : []),
      ];
      const byId = new Map();
      combined.forEach((c) => {
        const id = c.id ?? c.Id;
        if (id && !byId.has(id)) byId.set(id, c);
      });
      const merged = await enrichPatientCasesWithService(Array.from(byId.values()));
      setItems(merged);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaidCases();
  }, [fetchPaidCases]);

  const serviceOptions = useMemo(() => {
    const names = new Set();
    let hasEmpty = false;
    items.forEach((c) => {
      const d = getServiceDisplay(c);
      if (d) names.add(d);
      else hasEmpty = true;
    });
    const list = Array.from(names).sort((a, b) => a.localeCompare(b, "sq"));
    return { list, hasEmpty };
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((r) => {
      const status = r.status ?? r.Status;
      const sk = normalizeStatusKey(status);
      if (statusTab === "Completed" && sk !== "completed") return false;
      if (statusTab === "Finished" && sk !== "finished") return false;
      if (!caseMatchesNameQuery(r, nameSearch)) return false;
      if (serviceFilter) {
        const d = getServiceDisplay(r);
        if (serviceFilter === "__none__") {
          if (d) return false;
        } else if (d !== serviceFilter) return false;
      }
      const updated =
        r.updatedAt ??
        r.UpdatedAt ??
        r.completedAt ??
        r.CompletedAt ??
        r.createdAt ??
        r.CreatedAt;
      if (searchDate) return isSameCalendarDay(updated, searchDate);
      if (dateFilter === "today") return isSameDay(updated, new Date().toISOString());
      if (dateFilter === "yesterday") return isYesterday(updated);
      if (dateFilter === "week") return isInThisWeek(updated);
      return true;
    });
  }, [items, statusTab, nameSearch, serviceFilter, searchDate, dateFilter]);

  const totals = useMemo(() => {
    let sum = 0;
    let priced = 0;
    let unpriced = 0;
    let completed = 0;
    let finished = 0;
    filtered.forEach((r) => {
      const status = r.status ?? r.Status;
      const sk = normalizeStatusKey(status);
      if (sk === "completed") completed += 1;
      if (sk === "finished") finished += 1;
      const n = toPriceNumber(pickCaseServiceFields(r).servicePrice);
      if (n != null) {
        sum += n;
        priced += 1;
      } else unpriced += 1;
    });
    const count = filtered.length;
    const avg = count > 0 && priced > 0 ? sum / priced : null;
    return { sum, priced, unpriced, count, completed, finished, avg };
  }, [filtered]);

  return (
    <div className="page-shell">
      <PageHeader
        title="Pagesat"
        subtitle="Vizitat e paguara: rastet Përfunduar ose Mbyllur. Shuma vjen nga çmimi i shërbimit të lidhur me rastin."
        icon={FiDollarSign}
        actions={
          <button type="button" onClick={fetchPaidCases} disabled={loading} className="btn-secondary btn-md">
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
            Rifresko
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <FiDollarSign className="text-emerald-600" size={14} aria-hidden />
            Totali (i filtruar)
          </div>
          <p className="text-2xl font-bold tabular-nums text-slate-900">{formatEUR(totals.sum)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {totals.priced} me çmim{totals.unpriced > 0 ? ` · ${totals.unpriced} pa çmim` : ""}
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <FiPieChart className="text-clinic-400" size={14} aria-hidden />
            Vizita
          </div>
          <p className="text-2xl font-bold tabular-nums text-slate-900">{totals.count}</p>
          <p className="text-xs text-slate-500 mt-1">
            <span className="text-indigo-700 font-medium">{totals.completed} përfunduar</span>
            {" · "}
            <span className="text-slate-600 font-medium">{totals.finished} mbyllur</span>
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <FiLayers className="text-amber-600" size={14} aria-hidden />
            Mesatarja / vizitë me çmim
          </div>
          <p className="text-2xl font-bold tabular-nums text-slate-900">{formatEUR(totals.avg)}</p>
          <p className="text-xs text-slate-500 mt-1">Llogaritet vetëm për rreshtat me shumë të vendosur</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/90 to-white p-5 shadow-sm">
          <p className="text-slate-700 text-sm font-medium leading-snug">
            Filtrat më poshtë përditësojnë kartat dhe totalet në kohë reale. Për detaje klinike hapni rastin nga
            kolona e veprimeve.
          </p>
        </div>
      </div>

      <div className="table-shell">
        <div className="px-4 pt-4 pb-2 border-b border-slate-100 flex flex-wrap gap-2">
          <span className="text-sm font-medium text-slate-600 self-center mr-1">Statusi (pagesa):</span>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusTab(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusTab === tab.value
                  ? "tab-active"
                  : "tab-inactive"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-3 gap-y-3">
          <span className="text-sm font-medium text-slate-600">Koha:</span>
          {DATE_FILTERS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setDateFilter(opt.value);
                clearDateSearch();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !searchDate && dateFilter === opt.value
                  ? "tab-active"
                  : "tab-inactive"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <span className="hidden lg:inline h-6 w-px bg-slate-200 mx-1 self-center" aria-hidden />
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-[10rem]">
            <span className="text-sm text-slate-600 whitespace-nowrap">Shërbimi:</span>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-clinic-400/40 focus:border-clinic-400 outline-none min-w-[12rem] max-w-[20rem]"
            >
              <option value="">Të gjitha shërbimet</option>
              {serviceOptions.hasEmpty && <option value="__none__">Pa shërbim të caktuar</option>}
              {serviceOptions.list.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <span className="hidden lg:inline h-6 w-px bg-slate-200 mx-1 self-center" aria-hidden />
          <div className="flex flex-wrap items-center gap-2 min-w-[200px] flex-1 lg:flex-initial">
            <FiSearch className="text-slate-400 shrink-0" size={18} aria-hidden />
            <input
              type="search"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder="Kërko sipas emrit të pacientit…"
              className="flex-1 min-w-[12rem] px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-clinic-400/40 focus:border-clinic-400 outline-none"
            />
          </div>
        </div>

        <div className="px-4 pb-4 pt-0 border-b border-slate-200 flex flex-wrap items-center gap-3 gap-y-3">
          <div lang="en-GB" className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-600 inline-flex items-center gap-1.5">
              <FiCalendar size={16} className="text-clinic-400" aria-hidden />
              Sipas datës
            </span>
            <select
              aria-label="Dita"
              value={dateParts.day}
              onChange={(e) => setDatePart("day", e.target.value)}
              className={selectDateClassName}
            >
              <option value="">Ditë</option>
              {dayOptions.map((d) => (
                <option key={d} value={String(d)}>
                  {pad2(d)}
                </option>
              ))}
            </select>
            <select
              aria-label="Muaji"
              value={dateParts.month}
              onChange={(e) => setDatePart("month", e.target.value)}
              className={selectDateClassName}
            >
              <option value="">Muaj</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={String(m)}>
                  {pad2(m)}
                </option>
              ))}
            </select>
            <select
              aria-label="Viti"
              value={dateParts.year}
              onChange={(e) => setDatePart("year", e.target.value)}
              className={`${selectDateClassName} min-w-[5.5rem]`}
            >
              <option value="">Viti</option>
              {yearOptions.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
            {(dateParts.day || dateParts.month || dateParts.year) && (
              <button
                type="button"
                onClick={clearDateSearch}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                title="Hiq filtrin e datës"
              >
                <FiX size={16} aria-hidden />
                Hiq
              </button>
            )}
          </div>
          <span className="text-sm text-slate-500 sm:ml-auto basis-full sm:basis-auto">
            {filtered.length} rresht{filtered.length !== 1 ? "a" : ""} · total filtri:{" "}
            <span className="font-semibold tabular-nums text-slate-800">{formatEUR(totals.sum)}</span>
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <svg
              className="animate-spin h-8 w-8 text-clinic-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-6">
            <FiDollarSign className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-600">
              {nameSearch.trim() && "Nuk u gjet asnjë rast për këtë kërkim."}
              {!nameSearch.trim() && serviceFilter && "Nuk ka raste për këtë shërbim me filtrat e zgjedhur."}
              {!nameSearch.trim() &&
                !serviceFilter &&
                searchDate &&
                "Nuk ka vizita të paguara për këtë datë."}
              {!nameSearch.trim() &&
                !serviceFilter &&
                !searchDate &&
                dateFilter === "today" &&
                "Nuk ka vizita të paguara sot."}
              {!nameSearch.trim() &&
                !serviceFilter &&
                !searchDate &&
                dateFilter === "yesterday" &&
                "Nuk ka vizita të paguara dje."}
              {!nameSearch.trim() &&
                !serviceFilter &&
                !searchDate &&
                dateFilter === "week" &&
                "Nuk ka vizita të paguara këtë javë."}
              {!nameSearch.trim() &&
                !serviceFilter &&
                !searchDate &&
                dateFilter === "all" &&
                (items.length === 0
                  ? "Ende nuk ka raste të përfunduara ose të mbyllura."
                  : "Nuk ka raste që përputhen me filtrat.")}
            </p>
            <Link
              to="/dashboard/cases"
              className="inline-block mt-4 text-clinic-400 font-medium hover:underline"
            >
              Shko te Rastet
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Pacienti
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Data
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Statusi
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Shërbimi
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Shuma
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Veprime
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const caseId = r.id ?? r.Id;
                  const firstName = r.patientFirstName ?? r.PatientFirstName ?? "";
                  const lastName = r.patientLastName ?? r.PatientLastName ?? "";
                  const status = r.status ?? r.Status;
                  const updated =
        r.updatedAt ??
        r.UpdatedAt ??
        r.completedAt ??
        r.CompletedAt ??
        r.createdAt ??
        r.CreatedAt;
                  const serviceLabel = getServiceDisplay(r) || "—";
                  const { servicePrice } = pickCaseServiceFields(r);
                  const priceNum = toPriceNumber(servicePrice);
                  return (
                    <tr key={caseId} className="border-b border-slate-100/90 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          to={`/dashboard/cases/${caseId}`}
                          className="font-medium text-slate-900 hover:text-clinic-400"
                        >
                          {firstName} {lastName}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <FiClock size={13} className="flex-shrink-0 text-slate-400" />
                          {formatDate(updated)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border border-current/10 ${statusBadgeClass(status)}`}
                        >
                          {getStatusLabel(status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700 max-w-[220px] sm:max-w-xs">
                        <span className="line-clamp-2" title={serviceLabel !== "—" ? serviceLabel : undefined}>
                          {serviceLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900 text-right whitespace-nowrap tabular-nums font-medium">
                        {formatEUR(priceNum)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link
                          to={`/dashboard/cases/${caseId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-clinic-400 bg-clinic-400/10 rounded-lg hover:bg-clinic-400/20 transition-colors border border-clinic-400/20"
                        >
                          Hap rastin
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50/90 border-t-2 border-slate-200">
                  <td colSpan={4} className="py-3 px-4 text-right text-sm font-semibold text-slate-700">
                    Totali i shumave ({totals.priced} me çmim)
                  </td>
                  <td className="py-3 px-4 text-right text-sm font-bold tabular-nums text-emerald-800">
                    {formatEUR(totals.sum)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
