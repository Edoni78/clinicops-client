import React, { useEffect, useMemo, useState } from "react";
import {
  FiBookOpen,
  FiSearch,
  FiCopy,
  FiExternalLink,
  FiX,
  FiSave,
  FiUser,
  FiActivity,
  FiClipboard,
  FiEye,
  FiTrash2,
} from "react-icons/fi";
import api from "../../../api/axios";
import { getPatientEmr } from "../../../api/emr";
import { useAuth } from "../../../context/AuthContext";
import { submitReport, deletePatientCaseReport } from "../../../api/patientCase";
import { getDoctorProfile } from "../../../api/doctorProfile";
import Notification from "../../../components/ui/Notification";
import PageHeader from "../../../components/ui/PageHeader";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import EmptyState from "../../../components/ui/EmptyState";
import { isClinicAdminRole } from "../../../utils/dashboardMenu";

function fmt(date) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleString("sq-AL", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return date;
  }
}

function looksLikeEmail(v) {
  return typeof v === "string" && v.includes("@");
}

function resolveDoctorName(entry, fallbackDisplayName) {
  const raw =
    entry?.doctorDisplayName ??
    entry?.DoctorDisplayName ??
    entry?.doctorName ??
    entry?.DoctorName ??
    "";
  if (!raw) return fallbackDisplayName || "Mjek";
  if (looksLikeEmail(raw) && fallbackDisplayName) return fallbackDisplayName;
  return raw;
}

function getGenderLabel(gender) {
  const g = String(gender || "").trim().toLowerCase();
  if (g === "male" || g === "mashkull") return "Mashkull";
  if (g === "female" || g === "femer" || g === "femër") return "Femër";
  return gender || "—";
}

export default function EMRs() {
  const { role } = useAuth();
  const roleLower = String(role || "").toLowerCase();
  const isDoctor = roleLower === "doctor";
  const canDeleteReports = isDoctor || isClinicAdminRole(roleLower) || roleLower === "superadmin";
  const [doctorView, setDoctorView] = useState(isDoctor);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingEmr, setLoadingEmr] = useState(false);
  const [emr, setEmr] = useState(null);
  const [doctorDisplayName, setDoctorDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingReportCaseId, setDeletingReportCaseId] = useState(null);
  const [deletedReportCaseIds, setDeletedReportCaseIds] = useState(() => {
    try {
      const raw = sessionStorage.getItem("deleted_report_case_ids");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [editModal, setEditModal] = useState({
    open: false,
    caseId: "",
    consultDate: "",
    doctorName: "",
    caseStatus: "",
    vitals: [],
  });
  const [reportForm, setReportForm] = useState({ anamneza: "", diagnosis: "", therapy: "" });
  const [notif, setNotif] = useState({ visible: false, type: "info", message: "" });

  useEffect(() => {
    setDoctorView(isDoctor);
  }, [isDoctor]);

  useEffect(() => {
    if (!isDoctor) return;
    getDoctorProfile()
      .then((p) => {
        const n = p?.displayName ?? p?.DisplayName ?? "";
        setDoctorDisplayName(n || "");
      })
      .catch(() => setDoctorDisplayName(""));
  }, [isDoctor]);

  useEffect(() => {
    setLoadingPatients(true);
    api
      .get("/api/Patient")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setPatients(list);
      })
      .catch(() => {
        setPatients([]);
        setNotif({ visible: true, type: "error", message: "Nuk u ngarkuan pacientët." });
      })
      .finally(() => setLoadingPatients(false));
  }, []);

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => {
      const name = `${p.firstName || ""} ${p.lastName || ""}`.toLowerCase();
      const phone = String(p.phone || "").toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [patients, search]);

  const selectedPatient = useMemo(
    () => patients.find((p) => (p.id ?? p.patientId ?? p.Id) === selectedPatientId) || null,
    [patients, selectedPatientId]
  );

  const publicLink = selectedPatientId ? `${window.location.origin}/emr/${selectedPatientId}` : "";

  const loadEmr = async (patientId) => {
    if (!patientId) return;
    setLoadingEmr(true);
    try {
      const data = await getPatientEmr(patientId, doctorView && isDoctor);
      const history = Array.isArray(data?.history) ? [...data.history] : [];
      history.sort((a, b) => new Date(b.consultDate || 0) - new Date(a.consultDate || 0));
      setEmr({
        ...data,
        history: history.filter((h) => !deletedReportCaseIds.includes(h.patientCaseId)),
      });
    } catch (err) {
      setEmr(null);
      setNotif({
        visible: true,
        type: "error",
        message: err?.response?.data?.message || "Nuk u ngarkua EMR.",
      });
    } finally {
      setLoadingEmr(false);
    }
  };

  useEffect(() => {
    if (selectedPatientId) {
      loadEmr(selectedPatientId);
    } else {
      setEmr(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatientId, doctorView, isDoctor, deletedReportCaseIds]);

  useEffect(() => {
    sessionStorage.setItem("deleted_report_case_ids", JSON.stringify(deletedReportCaseIds));
  }, [deletedReportCaseIds]);

  const copyLink = async () => {
    if (!publicLink) return;
    try {
      await navigator.clipboard.writeText(publicLink);
      setNotif({ visible: true, type: "success", message: "Linku u kopjua." });
    } catch {
      setNotif({ visible: true, type: "warning", message: "Kopjimi dështoi. Kopjoje manualisht." });
    }
  };

  const openEditModal = (row) => {
    setEditModal({
      open: true,
      caseId: row.patientCaseId,
      consultDate: row.consultDate,
      doctorName: row.doctorName || "",
      caseStatus: row.caseStatus || "",
      vitals: Array.isArray(row.vitals) ? row.vitals : [],
    });
    setReportForm({
      anamneza: row.anamneza || "",
      diagnosis: row.diagnosis || "",
      therapy: row.therapy || "",
    });
  };

  const closeEditModal = () => {
    setEditModal({ open: false, caseId: "", consultDate: "" });
    setReportForm({ anamneza: "", diagnosis: "", therapy: "" });
  };

  const saveReport = async () => {
    if (!editModal.caseId) return;
    if (!reportForm.diagnosis.trim() || !reportForm.therapy.trim()) {
      setNotif({ visible: true, type: "warning", message: "Diagnoza dhe terapia janë të detyrueshme." });
      return;
    }
    setSaving(true);
    try {
      await submitReport(editModal.caseId, {
        anamneza: reportForm.anamneza,
        diagnosis: reportForm.diagnosis,
        therapy: reportForm.therapy,
      });
      setNotif({ visible: true, type: "success", message: "Raporti EMR u ruajt me sukses." });
      closeEditModal();
      if (selectedPatientId) await loadEmr(selectedPatientId);
    } catch (err) {
      setNotif({
        visible: true,
        type: "error",
        message: err?.response?.data?.message || "Ruajtja e raportit dështoi.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReport = async (caseId) => {
    const ok = window.confirm("Fshij raportin mjekësor për këtë konsultë?");
    if (!ok) return;
    setDeletingReportCaseId(caseId);
    try {
      await deletePatientCaseReport(caseId);
      setDeletedReportCaseIds((prev) => (prev.includes(caseId) ? prev : [...prev, caseId]));
      setNotif({ visible: true, type: "success", message: "Raporti EMR u fshi." });
      if (selectedPatientId) await loadEmr(selectedPatientId);
    } catch (err) {
      if (err?.response?.status === 404) {
        setDeletedReportCaseIds((prev) => (prev.includes(caseId) ? prev : [...prev, caseId]));
        // Hide missing report consult from current EMR history view.
        setEmr((prev) => {
          if (!prev || !Array.isArray(prev.history)) return prev;
          return {
            ...prev,
            history: prev.history.filter((h) => h.patientCaseId !== caseId),
          };
        });
        setNotif({
          visible: true,
          type: "info",
          message: "Raporti nuk u gjet; u fshi nga lista.",
        });
        return;
      }
      setNotif({
        visible: true,
        type: "error",
        message: err?.response?.data?.message || err?.response?.data || "Fshirja e raportit dështoi.",
      });
    } finally {
      setDeletingReportCaseId(null);
    }
  };

  return (
    <>
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((p) => ({ ...p, visible: false }))}
      />

      <div className="page-shell">
        <PageHeader
          title="EMRs"
          subtitle="Historia mjekësore për pacientët sipas konsultave të përfunduara."
          icon={FiBookOpen}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <section className="card p-4 sm:p-5 xl:col-span-1">
            <div className="input-icon-wrap mb-4">
              <FiSearch className="input-icon" size={18} />
              <input
                className="input-with-icon"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Kërko pacient..."
              />
            </div>

            {isDoctor && (
              <label className="flex items-center gap-2 mb-4 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={doctorView}
                  onChange={(e) => setDoctorView(e.target.checked)}
                />
                Doctor view (full EMR)
              </label>
            )}

            {loadingPatients ? (
              <LoadingSpinner className="py-8" label="Duke ngarkuar pacientët..." />
            ) : (
              <div className="max-h-[460px] overflow-y-auto space-y-3">
                {filteredPatients.map((p) => {
                  const id = p.id ?? p.patientId ?? p.Id;
                  const active = selectedPatientId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`w-full text-left px-3.5 py-3 rounded-xl border transition-colors ${
                        active
                          ? "bg-clinic-50 border-clinic-200 text-clinic-800"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                      onClick={() => setSelectedPatientId(id)}
                    >
                      <p className="font-medium truncate">
                        {p.firstName} {p.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{p.phone || "—"}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="card p-5 sm:p-7 xl:col-span-2">
            {!selectedPatientId ? (
              <EmptyState
                icon={FiBookOpen}
                title="Zgjidh një pacient"
                description="Nga lista majtas për të parë EMR historinë."
              />
            ) : loadingEmr ? (
              <LoadingSpinner className="py-10" label="Duke ngarkuar EMR..." />
            ) : !emr ? (
              <EmptyState icon={FiBookOpen} title="Nuk ka të dhëna EMR" />
            ) : (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-7">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">
                      {emr.firstName} {emr.lastName}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      DOB: {fmt(emr.dateOfBirth)} · {getGenderLabel(emr.gender)} · {emr.phone || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={copyLink} className="btn-secondary btn-sm">
                      <FiCopy size={15} />
                      Kopjo linkun e pacientit
                    </button>
                    <a href={publicLink} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">
                      <FiExternalLink size={15} />
                      Hap kartën publike
                    </a>
                  </div>
                </div>

                {!Array.isArray(emr.history) || emr.history.length === 0 ? (
                  <EmptyState icon={FiBookOpen} title="Nuk ka histori konsultash." />
                ) : (
                  <div className="space-y-5">
                    {emr.history.map((h) => {
                      const doctorName = resolveDoctorName(h, doctorDisplayName);
                      return (
                      <article
                        key={h.patientCaseId}
                        className="border border-slate-200 rounded-2xl p-5 bg-white shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                          <p className="font-semibold text-slate-900">Konsulta: {fmt(h.consultDate)}</p>
                          <span className="badge bg-slate-100 text-slate-700">{h.caseStatus || "—"}</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          <FiUser className="inline mr-1" size={14} />
                          Mjeku: <span className="font-medium text-slate-800">{doctorName || "—"}</span>
                        </p>
                        {h.diagnosis && (
                          <p className="text-sm text-slate-700 mb-2 leading-relaxed">
                            <FiClipboard className="inline mr-1" size={14} />
                            <span className="font-medium">Diagnoza:</span> {h.diagnosis}
                          </p>
                        )}
                        {h.therapy && (
                          <p className="text-sm text-slate-700 mb-2 leading-relaxed">
                            <span className="font-medium">Terapia:</span> {h.therapy}
                          </p>
                        )}
                        {h.anamneza && (
                          <p className="text-sm text-slate-700 mb-2 leading-relaxed">
                            <span className="font-medium">Anamneza:</span> {h.anamneza}
                          </p>
                        )}
                        {h.notes && (
                          <p className="text-sm text-slate-700 mb-3 leading-relaxed">
                            <span className="font-medium">Shënime:</span> {h.notes}
                          </p>
                        )}
                        <div className="text-xs text-slate-500 mb-4">
                          Raporti krijuar: {fmt(h.reportCreatedAt)} · doctorId: {h.doctorUserId || "—"}
                        </div>
                        {Array.isArray(h.vitals) && h.vitals.length > 0 && (
                          <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700">
                            <div className="font-medium mb-2">
                              <FiActivity className="inline mr-1" size={14} />
                              Shenjat vitale
                            </div>
                            Vitals i fundit: {h.vitals[0]?.weightKg ?? "—"}kg,{" "}
                            {h.vitals[0]?.systolicPressure ?? "—"}/{h.vitals[0]?.diastolicPressure ?? "—"} mmHg,{" "}
                            {h.vitals[0]?.temperatureC ?? "—"}C, HR {h.vitals[0]?.heartRate ?? "—"}
                          </div>
                        )}
                        {(isDoctor && doctorView) || canDeleteReports ? (
                          <div className="mt-4 flex gap-2 flex-wrap">
                            {isDoctor && doctorView && (
                              <button
                                type="button"
                                onClick={() => openEditModal({ ...h, doctorName })}
                                className="btn-primary btn-sm inline-flex"
                              >
                                <FiEye size={15} />
                                Hap EMR (modal)
                              </button>
                            )}
                            {canDeleteReports && (
                              <button
                                type="button"
                                onClick={() => handleDeleteReport(h.patientCaseId)}
                                disabled={deletingReportCaseId === h.patientCaseId}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 disabled:opacity-60"
                              >
                                <FiTrash2 size={14} />
                                {deletingReportCaseId === h.patientCaseId ? "Duke fshirë..." : "Fshij raportin"}
                              </button>
                            )}
                          </div>
                        ) : null}
                      </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {selectedPatient && (
          <p className="text-xs text-slate-500 mt-4">
            Link për pacientin ({selectedPatient.firstName} {selectedPatient.lastName}):{" "}
            <span className="font-mono break-all">{publicLink}</span>
          </p>
        )}
      </div>
      {editModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl p-6 sm:p-7">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">EMR i konsultës</h3>
                <p className="text-sm text-slate-600">Konsulta: {fmt(editModal.consultDate)}</p>
                <p className="text-sm text-slate-600">
                  Mjeku: {editModal.doctorName || "—"} · Statusi: {editModal.caseStatus || "—"}
                </p>
              </div>
              <button type="button" className="btn-ghost btn-sm" onClick={closeEditModal}>
                <FiX size={16} />
              </button>
            </div>

            <div className="space-y-5">
              {Array.isArray(editModal.vitals) && editModal.vitals.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700">
                  <div className="font-medium mb-2">
                    <FiActivity className="inline mr-1" size={14} />
                    Shenjat vitale
                  </div>
                  <p>
                    {editModal.vitals[0]?.weightKg ?? "—"}kg,{" "}
                    {editModal.vitals[0]?.systolicPressure ?? "—"}/
                    {editModal.vitals[0]?.diastolicPressure ?? "—"} mmHg,{" "}
                    {editModal.vitals[0]?.temperatureC ?? "—"}C, HR {editModal.vitals[0]?.heartRate ?? "—"}
                  </p>
                </div>
              )}
              <div>
                <label className="label">Anamneza</label>
                <textarea
                  className="input min-h-[104px]"
                  value={reportForm.anamneza}
                  onChange={(e) => setReportForm((p) => ({ ...p, anamneza: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Diagnoza *</label>
                <textarea
                  className="input min-h-[104px]"
                  value={reportForm.diagnosis}
                  onChange={(e) => setReportForm((p) => ({ ...p, diagnosis: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Terapia *</label>
                <textarea
                  className="input min-h-[104px]"
                  value={reportForm.therapy}
                  onChange={(e) => setReportForm((p) => ({ ...p, therapy: e.target.value }))}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn-secondary btn-sm" onClick={closeEditModal}>
                Anulo
              </button>
              <button type="button" className="btn-primary btn-sm" onClick={saveReport} disabled={saving}>
                <FiSave size={15} />
                {saving ? "Duke ruajtur..." : "Ruaj"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
