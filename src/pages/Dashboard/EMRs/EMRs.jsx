import React, { useEffect, useMemo, useState } from "react";
import {
  FiBookOpen,
  FiSearch,
  FiCopy,
  FiExternalLink,
  FiX,
  FiSave,
  FiUser,
  FiEye,
  FiTrash2,
  FiLink,
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
import EmrPatientHeader from "../../../components/emr/EmrPatientHeader";
import EmrConsultCard from "../../../components/emr/EmrConsultCard";
import EmrVitalsGrid from "../../../components/emr/EmrVitalsGrid";
import { isClinicAdminRole } from "../../../utils/dashboardMenu";
import {
  fmtEmrDate,
  resolveDoctorName,
  getPatientInitials,
} from "../../../utils/emrDisplay";

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

  const lastUpdated =
    emr?.history?.[0]?.reportCreatedAt || emr?.history?.[0]?.consultDate;

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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          <section className="card p-4 sm:p-5 xl:col-span-1 shadow-card-md">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Pacientët
            </p>
            <div className="input-icon-wrap mb-4">
              <FiSearch className="input-icon" size={20} />
              <input
                className="input-with-icon"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Kërko pacient..."
              />
            </div>

            {isDoctor && (
              <label className="flex items-center gap-3 mb-4 p-3 rounded-xl border border-clinic-200/80 bg-clinic-50/50 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-clinic-600 focus:ring-clinic-500"
                  checked={doctorView}
                  onChange={(e) => setDoctorView(e.target.checked)}
                />
                <span>
                  <span className="font-medium text-slate-900">Pamja e mjekut</span>
                  <span className="block text-xs text-slate-500 mt-0.5">EMR i plotë me redaktim</span>
                </span>
              </label>
            )}

            {loadingPatients ? (
              <LoadingSpinner className="py-8" label="Duke ngarkuar pacientët..." />
            ) : filteredPatients.length === 0 ? (
              <EmptyState icon={FiUser} title="Nuk u gjet asnjë pacient" />
            ) : (
              <div className="max-h-[480px] overflow-y-auto space-y-2 pr-0.5">
                {filteredPatients.map((p) => {
                  const id = p.id ?? p.patientId ?? p.Id;
                  const active = selectedPatientId === id;
                  const initials = getPatientInitials(p.firstName, p.lastName);
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`w-full text-left flex items-center gap-3 px-3.5 py-3.5 rounded-xl border transition-all duration-150 ${
                        active
                          ? "bg-clinic-50 border-clinic-300 shadow-sm ring-1 ring-clinic-500/15"
                          : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                      onClick={() => setSelectedPatientId(id)}
                    >
                      <span
                        className={`inline-flex shrink-0 items-center justify-center h-11 w-11 rounded-xl text-sm font-bold ${
                          active
                            ? "bg-clinic-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 truncate">
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{p.phone || "—"}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="card p-0 xl:col-span-2 overflow-hidden shadow-card-md border-slate-200/80">
            {!selectedPatientId ? (
              <div className="p-8 sm:p-12">
                <EmptyState
                  icon={FiBookOpen}
                  title="Zgjidh një pacient"
                  description="Nga lista majtas për të parë EMR historinë."
                />
              </div>
            ) : loadingEmr ? (
              <div className="p-8">
                <LoadingSpinner className="py-10" label="Duke ngarkuar EMR..." />
              </div>
            ) : !emr ? (
              <div className="p-8">
                <EmptyState icon={FiBookOpen} title="Nuk ka të dhëna EMR" />
              </div>
            ) : (
              <div className="p-5 sm:p-7">
                <div className="flex flex-wrap items-center justify-end gap-2 mb-5 -mt-1">
                  <button type="button" onClick={copyLink} className="btn-secondary btn-sm">
                    <FiCopy size={18} />
                    Kopjo linkun
                  </button>
                  <a
                    href={publicLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary btn-sm"
                  >
                    <FiExternalLink size={18} />
                    Kartela publike
                  </a>
                </div>

                <EmrPatientHeader emr={emr} lastUpdated={lastUpdated} showEmrId={false} />

                {!Array.isArray(emr.history) || emr.history.length === 0 ? (
                  <EmptyState icon={FiBookOpen} title="Nuk ka histori konsultash." />
                ) : (
                  <>
                    <div className="mb-5">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                        Historia e konsultave
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {emr.history.length}{" "}
                        {emr.history.length === 1 ? "konsultë" : "konsulta"} të regjistruara
                      </p>
                    </div>
                    <div className="space-y-5">
                      {emr.history.map((h) => {
                        const doctorName = resolveDoctorName(h, doctorDisplayName);
                        const showActions = (isDoctor && doctorView) || canDeleteReports;
                        return (
                          <EmrConsultCard
                            key={h.patientCaseId}
                            consult={h}
                            doctorName={doctorName}
                            variant="full"
                            showMeta={doctorView && isDoctor}
                            actions={
                              showActions ? (
                                <div className="flex gap-2 flex-wrap">
                                  {isDoctor && doctorView && (
                                    <button
                                      type="button"
                                      onClick={() => openEditModal({ ...h, doctorName })}
                                      className="btn-primary btn-sm inline-flex"
                                    >
                                      <FiEye size={18} />
                                      Redakto raportin
                                    </button>
                                  )}
                                  {canDeleteReports && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteReport(h.patientCaseId)}
                                      disabled={deletingReportCaseId === h.patientCaseId}
                                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 disabled:opacity-60"
                                    >
                                      <FiTrash2 size={18} />
                                      {deletingReportCaseId === h.patientCaseId
                                        ? "Duke fshirë..."
                                        : "Fshij raportin"}
                                    </button>
                                  )}
                                </div>
                              ) : null
                            }
                          />
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        </div>

        {selectedPatient && publicLink && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm">
            <FiLink className="shrink-0 text-clinic-600 mt-0.5" size={20} />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">
                Link publik për {selectedPatient.firstName} {selectedPatient.lastName}
              </p>
              <p className="font-mono text-xs text-slate-500 break-all mt-1">{publicLink}</p>
            </div>
          </div>
        )}
      </div>

      {editModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] flex flex-col shadow-card-lg overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-clinic-50/40 shrink-0">
              <div className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-clinic-600 text-white">
                  <FiBookOpen size={24} />
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Redakto raportin EMR</h3>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Konsulta: {fmtEmrDate(editModal.consultDate)}
                  </p>
                  <p className="text-sm text-slate-600">
                    Mjeku: {editModal.doctorName || "—"} · {editModal.caseStatus || "—"}
                  </p>
                </div>
              </div>
              <button type="button" className="btn-ghost rounded-xl p-2.5" onClick={closeEditModal}>
                <FiX size={22} />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-5">
              {Array.isArray(editModal.vitals) && editModal.vitals.length > 0 && (
                <EmrVitalsGrid vitals={editModal.vitals} compact />
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

            <div className="px-6 py-4 border-t border-slate-200/80 flex justify-end gap-2 shrink-0 bg-slate-50/50">
              <button type="button" className="btn-secondary btn-sm" onClick={closeEditModal}>
                Anulo
              </button>
              <button type="button" className="btn-primary btn-sm" onClick={saveReport} disabled={saving}>
                <FiSave size={18} />
                {saving ? "Duke ruajtur..." : "Ruaj raportin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
