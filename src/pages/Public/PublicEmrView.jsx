import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiBookOpen,
  FiShield,
  FiActivity,
  FiUser,
  FiClipboard,
  FiCheckCircle,
  FiCalendar,
  FiPhone,
  FiDroplet,
  FiThermometer,
  FiHeart,
  FiClock,
  FiLayers,
  FiX,
  FiFileText,
} from "react-icons/fi";
import { getPatientEmrPublic } from "../../api/emr";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";

function fmt(date) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleString("sq-AL", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return date;
  }
}

function getGenderLabel(gender) {
  const g = String(gender || "").trim().toLowerCase();
  if (g === "male" || g === "mashkull") return "Mashkull";
  if (g === "female" || g === "femer" || g === "femër") return "Femër";
  return gender || "—";
}

export default function PublicEmrView() {
  const { patientId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emr, setEmr] = useState(null);
  const [selectedConsult, setSelectedConsult] = useState(null);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    setError("");
    getPatientEmrPublic(patientId)
      .then((data) => {
        const history = Array.isArray(data?.history) ? [...data.history] : [];
        history.sort((a, b) => new Date(b.consultDate || 0) - new Date(a.consultDate || 0));
        setEmr({ ...data, history });
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "EMR nuk u gjet ose linku nuk është valid.");
      })
      .finally(() => setLoading(false));
  }, [patientId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-clinic-50/40 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-4 card p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-3">
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-clinic-100 text-clinic-700">
                <FiBookOpen size={20} />
              </span>
              <div>
                <h1 className="font-bold text-slate-900 text-lg">MyEMR</h1>
                <p className="text-sm text-slate-500">Electronic Medical Record</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              <FiShield size={16} />
              <div className="text-xs">
                <p className="font-semibold">Verified & Secure</p>
                <p className="text-emerald-600">Encrypted medical data</p>
              </div>
            </div>
          </div>
        </header>

        <section className="card p-5 sm:p-7">
          {loading ? (
            <LoadingSpinner className="py-16" label="Duke ngarkuar kartën EMR..." />
          ) : error ? (
            <EmptyState icon={FiBookOpen} title="EMR i paarritshëm" description={error} />
          ) : !emr ? (
            <EmptyState icon={FiBookOpen} title="Nuk ka të dhëna." />
          ) : (
            <>
              <div className="mb-5">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {emr.firstName} {emr.lastName}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                    <p className="text-xs text-slate-500 mb-1">Last Updated</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {fmt(emr.history?.[0]?.reportCreatedAt || emr.history?.[0]?.consultDate)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                    <p className="text-xs text-slate-500 mb-1">Patient</p>
                    <p className="text-sm font-semibold text-slate-800">
                      <FiUser className="inline mr-1" size={14} />
                      {getGenderLabel(emr.gender)}
                    </p>
                    <p className="text-xs text-slate-500">
                      <FiPhone className="inline mr-1" size={12} />
                      {emr.phone || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                    <p className="text-xs text-slate-500 mb-1">EMR ID</p>
                    <p className="text-sm font-semibold text-emerald-700 break-all">{emr.patientId}</p>
                    <p className="text-xs text-slate-500">
                      <FiCalendar className="inline mr-1" size={12} />
                      DOB: {fmt(emr.dateOfBirth)}
                    </p>
                  </div>
                </div>
              </div>

              {Array.isArray(emr.history) && emr.history.length > 0 && (
                <section className="mb-5 rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800">Vitals</h3>
                    <span className="text-xs text-slate-500">
                      Recorded on {fmt(emr.history[0]?.vitals?.[0]?.recordedAt)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-slate-200 p-3 bg-white">
                      <p className="text-xs text-slate-500 mb-1">
                        <FiHeart className="inline mr-1" size={12} /> Heart Rate
                      </p>
                      <p className="text-xl font-bold text-slate-900">{emr.history[0]?.vitals?.[0]?.heartRate ?? "—"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3 bg-white">
                      <p className="text-xs text-slate-500 mb-1">
                        <FiActivity className="inline mr-1" size={12} /> Blood Pressure
                      </p>
                      <p className="text-xl font-bold text-slate-900">
                        {emr.history[0]?.vitals?.[0]?.systolicPressure ?? "—"}/
                        {emr.history[0]?.vitals?.[0]?.diastolicPressure ?? "—"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3 bg-white">
                      <p className="text-xs text-slate-500 mb-1">
                        <FiThermometer className="inline mr-1" size={12} /> Temperature
                      </p>
                      <p className="text-xl font-bold text-slate-900">{emr.history[0]?.vitals?.[0]?.temperatureC ?? "—"} C</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3 bg-white">
                      <p className="text-xs text-slate-500 mb-1">
                        <FiDroplet className="inline mr-1" size={12} /> Weight
                      </p>
                      <p className="text-xl font-bold text-slate-900">{emr.history[0]?.vitals?.[0]?.weightKg ?? "—"} kg</p>
                    </div>
                  </div>
                </section>
              )}

              {!Array.isArray(emr.history) || emr.history.length === 0 ? (
                <EmptyState icon={FiHeart} title="Nuk ka histori konsultash." />
              ) : (
                <div className="space-y-3">
                  {emr.history.map((h) => (
                    <button
                      key={h.patientCaseId}
                      type="button"
                      onClick={() => setSelectedConsult(h)}
                      className="w-full text-left rounded-2xl border border-slate-200 p-4 sm:p-5 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-semibold text-slate-900">
                          <FiClock className="inline mr-1" size={14} />
                          Konsultë: {fmt(h.consultDate)}
                        </p>
                        <span className="badge bg-slate-100 text-slate-700">{h.caseStatus || "—"}</span>
                      </div>
                      <p className="text-sm text-slate-600">
                        <FiUser className="inline mr-1" size={14} />
                        {h.doctorName || "—"}
                      </p>
                      <p className="text-sm text-slate-700 mt-1 truncate">
                        <FiClipboard className="inline mr-1" size={14} />
                        {h.diagnosis || "Pa diagnozë"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        <div className="text-center mt-6">
          <Link to="/login" className="text-sm text-clinic-600 hover:underline">
            Hyr në panelin e klinikës
          </Link>
        </div>
      </div>
      {selectedConsult && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  <FiLayers className="inline mr-2" size={18} />
                  Consult Details
                </h3>
                <p className="text-sm text-slate-600">{fmt(selectedConsult.consultDate)}</p>
              </div>
              <button type="button" className="btn-ghost btn-sm" onClick={() => setSelectedConsult(null)}>
                <FiX size={16} />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <p>
                <FiUser className="inline mr-1" size={14} />
                <span className="font-medium">Doctor:</span> {selectedConsult.doctorName || "—"}
              </p>
              <p>
                <FiFileText className="inline mr-1" size={14} />
                <span className="font-medium">Status:</span> {selectedConsult.caseStatus || "—"}
              </p>
              {selectedConsult.diagnosis && (
                <p>
                  <FiClipboard className="inline mr-1" size={14} />
                  <span className="font-medium">Diagnosis:</span> {selectedConsult.diagnosis}
                </p>
              )}
              {selectedConsult.therapy && (
                <p>
                  <FiCheckCircle className="inline mr-1" size={14} />
                  <span className="font-medium">Therapy:</span> {selectedConsult.therapy}
                </p>
              )}
              {Array.isArray(selectedConsult.vitals) && selectedConsult.vitals.length > 0 && (
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="font-medium mb-1">
                    <FiActivity className="inline mr-1" size={14} />
                    Vitals
                  </p>
                  <p>
                    Weight: {selectedConsult.vitals[0]?.weightKg ?? "—"} kg · BP:{" "}
                    {selectedConsult.vitals[0]?.systolicPressure ?? "—"}/
                    {selectedConsult.vitals[0]?.diastolicPressure ?? "—"} · Temp:{" "}
                    {selectedConsult.vitals[0]?.temperatureC ?? "—"} C · HR:{" "}
                    {selectedConsult.vitals[0]?.heartRate ?? "—"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
