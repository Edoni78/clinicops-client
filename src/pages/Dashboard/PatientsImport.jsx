import React, { useCallback, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  FiUploadCloud,
  FiCheckCircle,
  FiAlertCircle,
  FiCopy,
  FiUsers,
  FiFileText,
  FiArrowRight,
  FiArrowLeft,
} from "react-icons/fi";
import PageHeader from "../../components/ui/PageHeader";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import Notification from "../../components/ui/Notification";
import { useConfirmModal } from "../../components/ui/ConfirmModal";
import { useAuth } from "../../context/AuthContext";
import { isClinicAdminRole } from "../../utils/dashboardMenu";
import {
  apiErrorMessage,
  confirmPatientMigration,
  listPatientMigrationRows,
  previewPatientMigration,
  uploadPatientMigration,
} from "../../api/patientMigration";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const STEPS = [
  { id: 1, label: "Ngarkimi" },
  { id: 2, label: "Hartëzimi" },
  { id: 3, label: "Parapamja" },
  { id: 4, label: "Importi" },
  { id: 5, label: "Rezultati" },
];

const EMPTY_MAPPINGS = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
};

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("sq-AL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(value);
  }
}

function statusBadgeClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "valid") return "badge-success";
  if (s === "invalid") return "badge bg-red-50 text-red-700 ring-1 ring-red-200/60";
  if (s === "duplicate") return "badge bg-amber-50 text-amber-800 ring-1 ring-amber-200/60";
  return "badge-neutral";
}

function statusLabel(status) {
  const s = String(status || "").toLowerCase();
  if (s === "valid") return "I vlefshëm";
  if (s === "invalid") return "I pavlefshëm";
  if (s === "duplicate") return "Dublikatë";
  return status || "—";
}

export default function PatientsImport() {
  const { role } = useAuth();
  const roleLower = String(role || "").toLowerCase();
  const isAllowed = isClinicAdminRole(roleLower);
  const { confirm, ConfirmDialog } = useConfirmModal();

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [upload, setUpload] = useState(null);
  const [mappings, setMappings] = useState({ ...EMPTY_MAPPINGS });
  const [preview, setPreview] = useState(null);
  const [rows, setRows] = useState([]);
  const [rowFilter, setRowFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [rowTotal, setRowTotal] = useState(0);
  const [result, setResult] = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  const [notif, setNotif] = useState({ visible: false, type: "info", message: "" });

  const fields = upload?.fields ?? upload?.Fields ?? [];
  const headers = upload?.headers ?? upload?.Headers ?? [];
  const migrationId = upload?.migrationId ?? upload?.MigrationId;

  const notify = (type, message) =>
    setNotif({ visible: true, type, message });

  const loadRows = useCallback(
    async (id, status, nextPage) => {
      const data = await listPatientMigrationRows(id, {
        status,
        page: nextPage,
        pageSize,
      });
      setRows(Array.isArray(data?.items) ? data.items : data?.Items ?? []);
      setRowTotal(Number(data?.total ?? data?.Total ?? 0));
      setPage(Number(data?.page ?? data?.Page ?? nextPage));
    },
    [pageSize]
  );

  const onPickFile = (nextFile) => {
    if (!nextFile) return;
    const name = nextFile.name || "";
    if (!name.toLowerCase().endsWith(".xlsx")) {
      notify("error", "Lejohet vetëm skedari Excel .xlsx.");
      return;
    }
    if (nextFile.size > MAX_FILE_BYTES) {
      notify("error", "Skedari e kalon madhësinë maksimale prej 20 MB.");
      return;
    }
    if (nextFile.size === 0) {
      notify("error", "Skedari është bosh. Zgjidhni një Excel me të dhëna.");
      return;
    }
    setFile(nextFile);
  };

  const handleUpload = async () => {
    if (!file || busy) return;
    setBusy(true);
    try {
      const data = await uploadPatientMigration(file);
      const suggested = data?.suggestedMappings ?? data?.SuggestedMappings ?? {};
      const nextMappings = { ...EMPTY_MAPPINGS };
      Object.entries(suggested).forEach(([key, value]) => {
        if (value) nextMappings[key] = value;
      });
      setUpload(data);
      setMappings(nextMappings);
      setPreview(null);
      setResult(null);
      setStep(2);
      notify("success", "Kolonat e Excel-it u lexuan. Hartëzoni fushat e pacientit.");
    } catch (err) {
      notify("error", apiErrorMessage(err, "Ngarkimi i Excel-it dështoi."));
    } finally {
      setBusy(false);
    }
  };

  const requiredMapped = useMemo(() => {
    const required = (fields.length ? fields : [
      { key: "firstName", required: true },
      { key: "lastName", required: true },
      { key: "dateOfBirth", required: true },
    ]).filter((f) => f.required || f.Required);
    return required.every((f) => mappings[f.key || f.Key]);
  }, [fields, mappings]);

  const handlePreview = async () => {
    if (!migrationId || busy || !requiredMapped) return;
    setBusy(true);
    try {
      const data = await previewPatientMigration(migrationId, mappings);
      setPreview(data);
      setRowFilter("All");
      setPage(1);
      await loadRows(migrationId, "All", 1);
      setStep(3);
      notify("success", "Parapamja u përgatit. Kontrolloni rreshtat para importit.");
    } catch (err) {
      notify("error", apiErrorMessage(err, "Parapamja e importit dështoi."));
    } finally {
      setBusy(false);
    }
  };

  const handleFilterChange = async (status) => {
    if (!migrationId || busy) return;
    setRowFilter(status);
    setBusy(true);
    try {
      await loadRows(migrationId, status, 1);
    } catch (err) {
      notify("error", apiErrorMessage(err, "Dështoi ngarkimi i rreshtave."));
    } finally {
      setBusy(false);
    }
  };

  const handlePageChange = async (nextPage) => {
    if (!migrationId || busy || nextPage < 1) return;
    setBusy(true);
    try {
      await loadRows(migrationId, rowFilter, nextPage);
    } catch (err) {
      notify("error", apiErrorMessage(err, "Dështoi ngarkimi i rreshtave."));
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    if (!migrationId || busy) return;
    const valid = Number(preview?.validRows ?? preview?.ValidRows ?? 0);
    const invalid = Number(preview?.invalidRows ?? preview?.InvalidRows ?? 0);
    const duplicates = Number(preview?.duplicateRows ?? preview?.DuplicateRows ?? 0);
    if (valid <= 0) {
      notify("warning", "Nuk ka rreshta të vlefshëm për import.");
      return;
    }

    const ok = await confirm({
      title: "Konfirmo importin e pacientëve",
      message: `${valid.toLocaleString("sq-AL")} pacientë janë gati për import. ${duplicates.toLocaleString("sq-AL")} rreshta dublikatë do të anashkalohen. ${invalid.toLocaleString("sq-AL")} rreshta të pavlefshëm nuk do të importohen. Pacientët do të shtohen vetëm në klinikën tuaj.`,
      confirmLabel: `Importo ${valid.toLocaleString("sq-AL")} pacientë`,
      cancelLabel: "Anulo",
      variant: "primary",
    });
    if (!ok) return;

    setBusy(true);
    setStep(4);
    try {
      const data = await confirmPatientMigration(migrationId);
      setResult(data);
      setStep(5);
      notify("success", "Importi i pacientëve përfundoi.");
    } catch (err) {
      setStep(3);
      notify("error", apiErrorMessage(err, "Importi dështoi. Asnjë pacient nuk u shtua."));
    } finally {
      setBusy(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setFile(null);
    setUpload(null);
    setMappings({ ...EMPTY_MAPPINGS });
    setPreview(null);
    setRows([]);
    setResult(null);
    setShowErrors(false);
    setRowFilter("All");
    setPage(1);
  };

  if (!isAllowed) return <Navigate to="/dashboard" replace />;

  const totalPages = Math.max(1, Math.ceil(rowTotal / pageSize));
  const summary = preview || result;
  const imported = Number(result?.importedRows ?? result?.ImportedRows ?? 0);
  const validRows = Number(summary?.validRows ?? summary?.ValidRows ?? 0);
  const invalidRows = Number(summary?.invalidRows ?? summary?.InvalidRows ?? 0);
  const duplicateRows = Number(summary?.duplicateRows ?? summary?.DuplicateRows ?? 0);
  const totalRows = Number(summary?.totalRows ?? summary?.TotalRows ?? 0);

  return (
    <>
      <ConfirmDialog />
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((prev) => ({ ...prev, visible: false }))}
      />

      <div className="page-shell max-w-6xl">
        <PageHeader
          title="Importo pacientë"
          subtitle="Ngarkoni një Excel nga sistemi i mëparshëm, hartëzoni kolonat dhe importoni pacientët në klinikën tuaj."
          icon={FiUploadCloud}
          actions={
            <Link to="/dashboard/patients-list" className="btn-secondary btn-md">
              <FiUsers size={18} />
              Lista e pacientëve
            </Link>
          }
        />

        <ol className="card p-3 sm:p-4 mb-6 flex flex-wrap gap-2">
          {STEPS.map((item) => {
            const active = step === item.id;
            const done = step > item.id;
            return (
              <li
                key={item.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  active
                    ? "bg-clinic-600 text-white"
                    : done
                      ? "bg-clinic-50 text-clinic-800"
                      : "bg-slate-50 text-slate-500"
                }`}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">
                  {done ? "✓" : item.id}
                </span>
                {item.label}
              </li>
            );
          })}
        </ol>

        {step === 1 && (
          <div className="card-padded">
            <h2 className="section-heading">Ngarkoni skedarin Excel</h2>
            <p className="text-sm text-slate-500 mt-1 mb-5">
              Mbështetet formati .xlsx. Kolonat mund të jenë në çdo gjuhë ose renditje — do t’i hartëzoni në hapin tjetër.
            </p>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                onPickFile(e.dataTransfer.files?.[0]);
              }}
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 cursor-pointer transition-colors ${
                dragOver
                  ? "border-clinic-500 bg-clinic-50"
                  : "border-slate-200 bg-slate-50/70 hover:border-clinic-300"
              }`}
            >
              <span className="icon-chip-lg">
                <FiUploadCloud size={22} />
              </span>
              <span className="text-sm font-medium text-slate-800">
                Zgjidhni ose tërhiqni skedarin Excel këtu
              </span>
              <span className="text-xs text-slate-500">.xlsx · maksimumi 20 MB</span>
              <input
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="sr-only"
                onChange={(e) => onPickFile(e.target.files?.[0])}
              />
            </label>

            {file && (
              <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FiFileText className="text-clinic-600 shrink-0" size={20} />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-primary btn-md"
                  onClick={handleUpload}
                  disabled={busy}
                >
                  {busy ? "Duke lexuar Excel-in…" : "Ngarko dhe lexo kolonat"}
                  {!busy && <FiArrowRight size={16} />}
                </button>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="card-padded">
            <h2 className="section-heading">Hartëzoni kolonat</h2>
            <p className="text-sm text-slate-500 mt-1 mb-5">
              Skedari: <span className="font-medium text-slate-700">{upload?.fileName ?? upload?.FileName}</span>
              {" · "}
              {headers.length} kolona të gjetura.
            </p>

            <div className="space-y-4">
              {(fields.length ? fields : [
                { key: "firstName", label: "Emri", required: true },
                { key: "lastName", label: "Mbiemri", required: true },
                { key: "dateOfBirth", label: "Data e lindjes", required: true },
                { key: "gender", label: "Gjinia", required: false },
                { key: "phone", label: "Telefoni", required: false },
              ]).map((field) => {
                const key = field.key || field.Key;
                return (
                  <div key={key} className="grid sm:grid-cols-[minmax(160px,220px)_1fr] gap-2 sm:items-center">
                    <label className="label mb-0" htmlFor={`map-${key}`}>
                      {field.label || field.Label}
                      {(field.required || field.Required) && (
                        <span className="text-red-500"> *</span>
                      )}
                    </label>
                    <select
                      id={`map-${key}`}
                      className="input"
                      value={mappings[key] || ""}
                      onChange={(e) =>
                        setMappings((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                    >
                      <option value="">
                        {(field.required || field.Required)
                          ? "Zgjidhni kolonën e Excel-it"
                          : "Mos e mapo"}
                      </option>
                      {headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="btn-secondary btn-md"
                onClick={() => setStep(1)}
                disabled={busy}
              >
                <FiArrowLeft size={16} />
                Kthehu
              </button>
              <button
                type="button"
                className="btn-primary btn-md"
                onClick={handlePreview}
                disabled={busy || !requiredMapped}
              >
                {busy ? "Duke validuar rreshtat…" : "Parapamja e importit"}
                {!busy && <FiArrowRight size={16} />}
              </button>
            </div>
          </div>
        )}

        {(step === 3 || step === 4) && preview && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <SummaryCard label="Gjithsej" value={totalRows} />
              <SummaryCard label="Të vlefshëm" value={validRows} tone="success" />
              <SummaryCard label="Të pavlefshëm" value={invalidRows} tone="danger" />
              <SummaryCard label="Dublikatë" value={duplicateRows} tone="warning" />
            </div>

            {step === 4 ? (
              <div className="card-padded">
                <LoadingSpinner className="py-10" label="Duke importuar pacientët e vlefshëm…" />
              </div>
            ) : (
              <div className="table-shell">
                <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-2 bg-slate-50/40">
                  {[
                    { value: "All", label: "Të gjithë" },
                    { value: "Valid", label: "Të vlefshëm" },
                    { value: "Invalid", label: "Të pavlefshëm" },
                    { value: "Duplicate", label: "Dublikatë" },
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      className={rowFilter === tab.value ? "tab-active" : "tab-inactive"}
                      onClick={() => handleFilterChange(tab.value)}
                      disabled={busy}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {busy && rows.length === 0 ? (
                  <LoadingSpinner className="py-12" label="Duke ngarkuar rreshtat…" />
                ) : rows.length === 0 ? (
                  <EmptyState
                    icon={FiFileText}
                    title="Nuk ka rreshta në këtë filtër"
                    description="Ndryshoni filtrin për të parë rreshtat e tjerë të parapamjes."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="table-head-row">
                          <th className="table-th">Rreshti</th>
                          <th className="table-th">Emri</th>
                          <th className="table-th">Telefoni</th>
                          <th className="table-th">Datëlindja</th>
                          <th className="table-th">Statusi</th>
                          <th className="table-th">Gabimi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.rowNumber ?? row.RowNumber} className="table-row">
                            <td className="table-td">{row.rowNumber ?? row.RowNumber}</td>
                            <td className="table-td font-medium text-slate-900">
                              {[row.firstName ?? row.FirstName, row.lastName ?? row.LastName]
                                .filter(Boolean)
                                .join(" ") || "—"}
                            </td>
                            <td className="table-td">{row.phone ?? row.Phone ?? "—"}</td>
                            <td className="table-td">
                              {formatDate(row.dateOfBirth ?? row.DateOfBirth)}
                            </td>
                            <td className="table-td">
                              <span className={statusBadgeClass(row.status ?? row.Status)}>
                                {statusLabel(row.status ?? row.Status)}
                              </span>
                            </td>
                            <td className="table-td text-slate-600 max-w-xs">
                              {row.error ?? row.Error ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 text-sm text-slate-600">
                  <span>
                    Faqja {page} nga {totalPages} · {rowTotal.toLocaleString("sq-AL")} rreshta
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      disabled={busy || page <= 1}
                      onClick={() => handlePageChange(page - 1)}
                    >
                      Para
                    </button>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      disabled={busy || page >= totalPages}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      Tjetër
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn-secondary btn-md"
                  onClick={() => setStep(2)}
                  disabled={busy}
                >
                  <FiArrowLeft size={16} />
                  Ndrysho hartëzimin
                </button>
                <button
                  type="button"
                  className="btn-primary btn-md"
                  onClick={handleConfirm}
                  disabled={busy || validRows <= 0}
                >
                  Konfirmo importin
                </button>
              </div>
            )}
          </div>
        )}

        {step === 5 && result && (
          <div className="space-y-6">
            <div className="card-padded text-center">
              <div className="mx-auto mb-4 icon-chip-lg">
                <FiCheckCircle size={24} />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Importi i pacientëve përfundoi</h2>
              <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">
                Pacientët e vlefshëm u shtuan në klinikën tuaj. Rreshtat dublikatë dhe të pavlefshëm nuk u importuan.
              </p>
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <SummaryCard label="Të importuar" value={imported} tone="success" />
              <SummaryCard label="Dublikatë të anashkaluara" value={duplicateRows} tone="warning" />
              <SummaryCard label="Rreshta të pavlefshëm" value={invalidRows} tone="danger" />
              <SummaryCard label="Gjithsej" value={totalRows} />
            </div>

            {showErrors && (
              <div className="table-shell">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-medium text-slate-900">Rreshtat me gabime</h3>
                </div>
                <ErrorRows migrationId={migrationId} />
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Link to="/dashboard/patients-list" className="btn-primary btn-md">
                <FiUsers size={16} />
                Shiko pacientët
              </Link>
              <button
                type="button"
                className="btn-secondary btn-md"
                onClick={() => setShowErrors((v) => !v)}
              >
                <FiAlertCircle size={16} />
                {showErrors ? "Fshih gabimet" : "Shiko gabimet"}
              </button>
              <button type="button" className="btn-secondary btn-md" onClick={resetWizard}>
                <FiCopy size={16} />
                Importo një skedar tjetër
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function SummaryCard({ label, value, tone }) {
  const toneClass =
    tone === "success"
      ? "text-emerald-700"
      : tone === "danger"
        ? "text-red-700"
        : tone === "warning"
          ? "text-amber-700"
          : "text-slate-900";

  return (
    <div className="card p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${toneClass}`}>
        {Number(value || 0).toLocaleString("sq-AL")}
      </p>
    </div>
  );
}

function ErrorRows({ migrationId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    let active = true;
    listPatientMigrationRows(migrationId, { status: "Invalid", page: 1, pageSize: 100 })
      .then((data) => {
        if (!active) return;
        setItems(Array.isArray(data?.items) ? data.items : data?.Items ?? []);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [migrationId]);

  if (loading) return <LoadingSpinner className="py-8" label="Duke ngarkuar gabimet…" />;
  if (items.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-slate-500">Nuk ka rreshta të pavlefshëm për t’u shfaqur.</p>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {items.map((row) => (
        <div key={row.rowNumber ?? row.RowNumber} className="px-4 py-3 text-sm">
          <p className="font-medium text-slate-900">
            Rreshti {row.rowNumber ?? row.RowNumber}
            {(row.firstName || row.FirstName) && (
              <span className="font-normal text-slate-600">
                {" · "}
                {[row.firstName ?? row.FirstName, row.lastName ?? row.LastName].filter(Boolean).join(" ")}
              </span>
            )}
          </p>
          <p className="text-slate-600 mt-1">{row.error ?? row.Error}</p>
        </div>
      ))}
    </div>
  );
}
