import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiBookOpen, FiShield, FiLock } from "react-icons/fi";
import { getPatientEmrPublic } from "../../api/emr";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import EmrPatientHeader from "../../components/emr/EmrPatientHeader";
import EmrVitalsGrid from "../../components/emr/EmrVitalsGrid";
import EmrConsultCard from "../../components/emr/EmrConsultCard";
import EmrConsultDetailModal from "../../components/emr/EmrConsultDetailModal";
import { resolveDoctorName } from "../../utils/emrDisplay";

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

  const latestVitals = emr?.history?.[0]?.vitals;
  const lastUpdated =
    emr?.history?.[0]?.reportCreatedAt || emr?.history?.[0]?.consultDate;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <header className="mb-4 rounded-md border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-3">
              <span className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-slate-900 text-white">
                <FiBookOpen size={18} strokeWidth={2} />
              </span>
              <div>
                <h1 className="font-semibold text-slate-900 text-base tracking-tight">
                  Kartela EMR
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Regjistër elektronik mjekësor për pacientin
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
              <FiShield size={16} className="text-emerald-700" />
              <div className="text-xs">
                <p className="font-semibold text-emerald-900">E verifikuar</p>
                <p className="text-emerald-700 flex items-center gap-1 mt-0.5">
                  <FiLock size={11} />
                  Të dhëna të mbrojtura
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="card p-0 sm:p-0 overflow-hidden border-slate-200/80 shadow-card-md">
          {loading ? (
            <div className="p-8 sm:p-12">
              <LoadingSpinner className="py-16" label="Duke ngarkuar kartën EMR..." />
            </div>
          ) : error ? (
            <div className="p-8">
              <EmptyState icon={FiBookOpen} title="EMR i paarritshëm" description={error} />
            </div>
          ) : !emr ? (
            <div className="p-8">
              <EmptyState icon={FiBookOpen} title="Nuk ka të dhëna." />
            </div>
          ) : (
            <div className="p-5 sm:p-7">
              <EmrPatientHeader
                emr={emr}
                lastUpdated={lastUpdated}
                variant="public"
                showEmrId
              />

              {Array.isArray(latestVitals) && latestVitals.length > 0 && (
                <div className="mb-6">
                  <EmrVitalsGrid vitals={latestVitals} />
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Historia e konsultave
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Klikoni një konsultë për të parë detajet e plota
                </p>
              </div>

              {!Array.isArray(emr.history) || emr.history.length === 0 ? (
                <EmptyState icon={FiBookOpen} title="Nuk ka histori konsultash." />
              ) : (
                <div className="space-y-4">
                  {emr.history.map((h) => (
                    <EmrConsultCard
                      key={h.patientCaseId}
                      consult={h}
                      doctorName={resolveDoctorName(h)}
                      variant="timeline"
                      onSelect={setSelectedConsult}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <p className="text-center mt-8 text-xs text-slate-400">
          Dokument i gjeneruar nga klinika juaj · Vetëm për lexim
        </p>
        <div className="text-center mt-3 pb-4">
          <Link
            to="/login"
            className="text-sm font-medium text-clinic-600 hover:text-clinic-700 hover:underline"
          >
            Hyr në panelin e klinikës
          </Link>
        </div>
      </div>

      <EmrConsultDetailModal
        consult={selectedConsult}
        doctorName={selectedConsult ? resolveDoctorName(selectedConsult) : ""}
        onClose={() => setSelectedConsult(null)}
      />
    </div>
  );
}
