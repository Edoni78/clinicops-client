import React, { useState, useEffect, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  FiDroplet,
  FiFolder,
  FiUpload,
  FiFile,
  FiDownload,
  FiRefreshCw,
  FiClock,
  FiCalendar,
  FiSearch,
} from "react-icons/fi";
import { getPatientCases, getLabResults, uploadLabResult, downloadLabResultFile } from "../../api/patientCase";
import Notification from "../../components/ui/Notification";
import PageHeader from "../../components/ui/PageHeader";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import { useAuth } from "../../context/AuthContext";
import { CLINIC_MODE_SOLO_DOCTOR } from "../../utils/clinicMode";

const STATUS_LABELS = {
  Waiting: "Në pritje",
  InProgress: "Në progres",
  InConsultation: "Në konsultim",
  Completed: "Përfunduar",
  Finished: "Mbyllur",
};

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status;
}

function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleString("sq-AL", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return dateString;
  }
}

function statusBadgeClass(status) {
  const map = {
    Waiting: "bg-amber-100 text-amber-800",
    InProgress: "bg-blue-100 text-blue-800",
    InConsultation: "bg-violet-100 text-violet-800",
    Completed: "bg-emerald-100 text-emerald-800",
    Finished: "bg-slate-100 text-slate-700",
  };
  return map[status] || "bg-gray-100 text-gray-800";
}

/** Returns YYYY-MM-DD in local time for a case date (createdAt). */
function caseDateKey(dateString) {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "";
  }
}

const DATE_FILTER_ALL = "all";
const DATE_FILTER_TODAY = "today";
const DATE_FILTER_YESTERDAY = "yesterday";

export default function Laboratory() {
  const { clinicMode } = useAuth();
  const isSoloDoctorClinic = clinicMode === CLINIC_MODE_SOLO_DOCTOR;
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [labsByCaseId, setLabsByCaseId] = useState({});
  const [uploadingCaseId, setUploadingCaseId] = useState(null);
  const [notif, setNotif] = useState({ visible: false, type: "info", message: "" });
  const [dateFilter, setDateFilter] = useState(DATE_FILTER_ALL);
  const [searchDate, setSearchDate] = useState("");

  const showNotif = (type, message) => {
    setNotif({ visible: true, type, message });
  };

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getPatientCases();
      setCases(Array.isArray(list) ? list : []);
      return list;
    } catch {
      setCases([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLabsForCases = useCallback((caseList) => {
    if (!caseList?.length) return;
    const ids = caseList.map((c) => c.id ?? c.Id).filter(Boolean);
    Promise.all(
      ids.map((caseId) =>
        getLabResults(caseId).then((list) => ({ caseId, list: Array.isArray(list) ? list : [] }))
      )
    ).then((pairs) => {
      setLabsByCaseId((prev) => {
        const next = { ...prev };
        pairs.forEach(({ caseId, list }) => {
          next[caseId] = list;
        });
        return next;
      });
    });
  }, []);

  useEffect(() => {
    fetchCases().then((list) => loadLabsForCases(list));
  }, [fetchCases, loadLabsForCases]);

  const refreshLabsForCase = (caseId) => {
    getLabResults(caseId).then((list) => {
      setLabsByCaseId((prev) => ({ ...prev, [caseId]: Array.isArray(list) ? list : [] }));
    });
  };

  const handleUpload = (caseId, file) => {
    if (!file || !caseId) return;
    setUploadingCaseId(caseId);
    uploadLabResult(caseId, file)
      .then(() => {
        refreshLabsForCase(caseId);
        showNotif("success", "Rezultati i laboratorit u ngarkua.");
      })
      .catch((err) => {
        const msg = err.response?.data?.message || err.response?.data || "Ngarkimi dështoi.";
        showNotif("error", msg);
      })
      .finally(() => setUploadingCaseId(null));
  };

  const todayKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKey = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, "0")}-${String(yesterdayDate.getDate()).padStart(2, "0")}`;

  const filteredCases = (() => {
    if (searchDate) {
      return cases.filter((c) => caseDateKey(c.createdAt ?? c.CreatedAt) === searchDate);
    }
    if (dateFilter === DATE_FILTER_TODAY) {
      return cases.filter((c) => caseDateKey(c.createdAt ?? c.CreatedAt) === todayKey);
    }
    if (dateFilter === DATE_FILTER_YESTERDAY) {
      return cases.filter((c) => caseDateKey(c.createdAt ?? c.CreatedAt) === yesterdayKey);
    }
    return cases;
  })();

  if (isSoloDoctorClinic) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="page-shell max-w-5xl">
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((p) => ({ ...p, visible: false }))}
      />

      <PageHeader
        title="Laboratori"
        subtitle="Të gjitha rastet. Për çdo rast mund të shikoni dhe të shtoni PDF të rezultateve të laboratorit."
        icon={FiDroplet}
        actions={
          <button
            type="button"
            onClick={() => fetchCases().then(loadLabsForCases)}
            disabled={loading}
            className="btn-secondary btn-md"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
            Rifresko
          </button>
        }
      />

      <div className="card p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
        <div className="filter-bar">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500 mr-1">Data:</span>
          <button
            type="button"
            onClick={() => { setDateFilter(DATE_FILTER_ALL); setSearchDate(""); }}
            className={dateFilter === DATE_FILTER_ALL && !searchDate ? "tab-active" : "tab-inactive"}
          >
            Të gjitha
          </button>
          <button
            type="button"
            onClick={() => { setDateFilter(DATE_FILTER_TODAY); setSearchDate(""); }}
            className={dateFilter === DATE_FILTER_TODAY && !searchDate ? "tab-active" : "tab-inactive"}
          >
            Sot
          </button>
          <button
            type="button"
            onClick={() => { setDateFilter(DATE_FILTER_YESTERDAY); setSearchDate(""); }}
            className={dateFilter === DATE_FILTER_YESTERDAY && !searchDate ? "tab-active" : "tab-inactive"}
          >
            Dje
          </button>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <FiSearch className="text-slate-400" size={16} />
          <input
            type="date"
            value={searchDate}
            onChange={(e) => {
              const v = e.target.value;
              setSearchDate(v);
              if (v) setDateFilter(DATE_FILTER_ALL);
            }}
            className="input py-2 w-auto"
            title="Kërko sipas date"
          />
          {searchDate && (
            <button type="button" onClick={() => setSearchDate("")} className="btn-ghost btn-sm">
              Pastro
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" label="Duke ngarkuar rastet…" />
      ) : cases.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FiFolder}
            title="Nuk ka raste"
            description="Rastet do të shfaqen këtu kur të ekzistojnë."
            action={
              <Link to="/dashboard/cases" className="btn-primary btn-md">
                <FiFolder size={16} />
                Shiko rastet
              </Link>
            }
          />
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FiCalendar}
            title="Nuk ka raste për këtë date"
            description={
              searchDate
                ? `Nuk u gjet asnjë rast për ${searchDate}.`
                : "Ndryshoni filtrim ose zgjidhni një datë tjetër."
            }
            action={
              <button
                type="button"
                onClick={() => { setDateFilter(DATE_FILTER_ALL); setSearchDate(""); }}
                className="btn-primary btn-md"
              >
                Shfaq të gjitha
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCases.map((c) => {
            const caseId = c.id ?? c.Id;
            const patientName = [c.patientFirstName ?? c.PatientFirstName, c.patientLastName ?? c.PatientLastName]
              .filter(Boolean)
              .join(" ");
            const status = c.status ?? c.Status;
            const labs = labsByCaseId[caseId] ?? [];
            const isUploading = uploadingCaseId === caseId;

            return (
              <div key={caseId} className="card overflow-hidden border-l-[3px] border-l-clinic-500">
                <div className="px-4 sm:px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      to={`/dashboard/cases/${caseId}`}
                      className="text-sm font-semibold text-slate-900 hover:text-clinic-700 transition-colors"
                    >
                      {patientName || "Pacient"}
                    </Link>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <FiClock size={13} />
                      {formatDate(c.createdAt ?? c.CreatedAt)}
                    </span>
                    <span className={`badge ${statusBadgeClass(status)}`}>
                      {getStatusLabel(status)}
                    </span>
                  </div>
                  <Link
                    to={`/dashboard/cases/${caseId}`}
                    className="text-xs font-medium text-clinic-600 hover:text-clinic-700"
                  >
                    Hap rastin →
                  </Link>
                </div>

                <div className="px-4 sm:px-5 py-4 bg-slate-50/50">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                    <FiDroplet size={14} className="text-clinic-600" />
                    Rezultatet e laboratorit
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <label className="btn-primary btn-sm cursor-pointer">
                      <FiUpload size={14} />
                      {isUploading ? "Duke ngarkuar…" : "Shto PDF"}
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        disabled={isUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(caseId, file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>

                  {labs.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">Nuk ka rezultate laboratori për këtë rast.</p>
                  ) : (
                    <ul className="space-y-2">
                      {labs.map((lab) => (
                        <li
                          key={lab.id ?? lab.Id}
                          className="flex flex-wrap items-center justify-between gap-2 py-2.5 px-3 rounded-lg bg-white border border-slate-200/80"
                        >
                          <span className="flex items-center gap-2 text-slate-800 text-sm min-w-0">
                            <FiFile className="text-clinic-600 flex-shrink-0" size={15} />
                            <span className="truncate">{lab.fileName ?? lab.FileName ?? "lab-result.pdf"}</span>
                          </span>
                          <span className="text-xs text-slate-500">
                            {lab.uploadedAt ?? lab.UploadedAt
                              ? new Date(lab.uploadedAt ?? lab.UploadedAt).toLocaleString("sq-AL")
                              : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              downloadLabResultFile(
                                lab.downloadUrl ?? lab.DownloadUrl,
                                lab.fileName ?? lab.FileName ?? "lab-result.pdf"
                              )
                            }
                            className="btn-secondary btn-sm"
                          >
                            <FiDownload size={14} />
                            Shkarko
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
