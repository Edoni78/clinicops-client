import React from "react";
import { FiActivity, FiCheck, FiDownload, FiFileText, FiImage, FiUser } from "react-icons/fi";

const inputClass =
  "w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:ring-2 focus:ring-clinic-400/30 focus:border-clinic-400 outline-none";

export default function DoctorSectionSimple(props) {
  const {
    isSoloDoctorClinic,
    latestVitals,
    doctorNextStatuses,
    statusSubmitting,
    handleStatusChange,
    handleDownloadReportPdf,
    patientDisplayName,
    patientGender,
    patientPhone,
    formatDateDisplay,
    patientDob,
    caseData,
    canEditReportAndStatus,
    handleSubmitReport,
    report,
    setReport,
    reportSubmitting,
    medicalReport,
    doctorProfileLoading,
    signaturePreviewUrl,
    stampPreviewUrl,
    services,
    servicesLoading,
    selectedServiceId,
    setSelectedServiceId,
    serviceSubmitting,
    handleAttachService,
    attachedServiceName,
    attachedServicePrice,
  } = props;

  // 3-step flow: "Fillo konsultimin" (→InConsultation) in header,
  // "Përfundo vizitën" (→Finished) shown alongside the report form.
  const doctorCanCompleteVisit = doctorNextStatuses.includes("Finished");
  const doctorHeaderStatuses = doctorNextStatuses.filter((s) => s === "InConsultation");

  const doctorActionLabel = (s) => {
    if (s === "InConsultation") return "Fillo konsultimin";
    if (s === "Finished") return "Përfundo vizitën";
    return s;
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 border-l-4 border-l-slate-700">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <FiFileText className="text-slate-700" size={16} aria-hidden />
          Mjeku
        </h2>
      </div>

      <div className="p-5 space-y-5">
        {!isSoloDoctorClinic && (
          <section>
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <FiActivity size={14} className="text-clinic-400" aria-hidden />
              Shenjat jetësore
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                <p className="text-[10px] font-medium text-slate-500 uppercase">Pesha</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900 tabular-nums">
                  {(latestVitals?.weightKg ?? latestVitals?.WeightKg) != null
                    ? `${latestVitals?.weightKg ?? latestVitals?.WeightKg} kg`
                    : "—"}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                <p className="text-[10px] font-medium text-slate-500 uppercase">Presioni</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900 tabular-nums">
                  {(latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure) != null &&
                  (latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure) != null
                    ? `${latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure} / ${latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure}`
                    : "—"}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                <p className="text-[10px] font-medium text-slate-500 uppercase">Temperatura</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900 tabular-nums">
                  {(latestVitals?.temperatureC ?? latestVitals?.TemperatureC) != null
                    ? `${latestVitals?.temperatureC ?? latestVitals?.TemperatureC} °C`
                    : "—"}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                <p className="text-[10px] font-medium text-slate-500 uppercase">Rrahjet</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900 tabular-nums">
                  {(latestVitals?.heartRate ?? latestVitals?.HeartRate) != null
                    ? `${latestVitals?.heartRate ?? latestVitals?.HeartRate} bpm`
                    : "—"}
                </p>
              </div>
            </div>
          </section>
        )}

        {doctorHeaderStatuses.length > 0 && (
          <section className={!isSoloDoctorClinic ? "pt-4 border-t border-slate-200" : ""}>
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
              Veprimet
            </h3>
            <div className="flex flex-wrap gap-2">
              {doctorHeaderStatuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={statusSubmitting}
                  onClick={() => handleStatusChange(s)}
                  className="px-4 py-2 bg-clinic-400 text-white text-sm font-medium rounded-md hover:bg-clinic-500 disabled:opacity-50 transition-colors"
                >
                  {doctorActionLabel(s)}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="border-t border-slate-200">
        <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 border-b border-slate-200">
          <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
            Raporti mjekësor
          </h3>
          <button
            type="button"
            onClick={handleDownloadReportPdf}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white text-slate-800 text-sm font-medium rounded-md border border-slate-300 hover:border-clinic-400/50 transition-colors"
          >
            <FiDownload size={16} aria-hidden />
            PDF
          </button>
        </div>

        <div className="bg-white">
          <section className="border-b border-slate-200">
            <h4 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <FiUser size={12} aria-hidden />
              Pacienti
            </h4>
            <div className="divide-y divide-slate-100">
              {[
                { label: "Emri", value: patientDisplayName },
                { label: "Gjinia", value: patientGender },
                { label: "Telefoni", value: patientPhone },
                { label: "Data e lindjes", value: formatDateDisplay(patientDob) },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-2.5 text-sm"
                >
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-slate-900 text-right">{value}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <FiFileText size={12} aria-hidden />
              Shënime klinike
            </h4>
            {canEditReportAndStatus ? (
              <form onSubmit={handleSubmitReport} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Anamneza</label>
                  <textarea
                    value={report.anamneza}
                    onChange={(e) => setReport((p) => ({ ...p, anamneza: e.target.value }))}
                    rows={3}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Diagnoza *
                  </label>
                  <textarea
                    value={report.diagnosis}
                    onChange={(e) => setReport((p) => ({ ...p, diagnosis: e.target.value }))}
                    rows={3}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Terapia *
                  </label>
                  <textarea
                    value={report.therapy}
                    onChange={(e) => setReport((p) => ({ ...p, therapy: e.target.value }))}
                    rows={3}
                    required
                    className={inputClass}
                  />
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    Shërbimi
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <select
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      disabled={servicesLoading || serviceSubmitting}
                      className={`${inputClass} sm:max-w-md`}
                    >
                      <option value="">
                        {servicesLoading ? "Duke ngarkuar…" : "Zgjidh shërbimin"}
                      </option>
                      {services.map((s) => {
                        const sid = s.id ?? s.Id;
                        const name = s.name ?? s.Name ?? "—";
                        const price = s.price ?? s.Price;
                        return (
                          <option key={sid} value={sid}>
                            {name}{" "}
                            {typeof price === "number" ? `· ${price.toFixed(2)} EUR` : ""}
                          </option>
                        );
                      })}
                    </select>
                    <button
                      type="button"
                      disabled={serviceSubmitting || !selectedServiceId}
                      onClick={handleAttachService}
                      className="px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-md hover:bg-slate-800 disabled:opacity-50"
                    >
                      {serviceSubmitting ? "Duke ruajtur…" : "Ruaj"}
                    </button>
                  </div>
                  {attachedServiceName && (
                    <p className="text-xs text-slate-500 mt-2">
                      <span className="font-medium text-slate-700">{attachedServiceName}</span>
                      {attachedServicePrice != null
                        ? ` · ${Number(attachedServicePrice).toFixed(2)} EUR`
                        : ""}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-start gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-clinic-400 text-white text-sm font-semibold rounded-md hover:bg-clinic-500 disabled:opacity-50"
                  >
                    {reportSubmitting ? (
                      <span className="animate-pulse">Duke ruajtur…</span>
                    ) : (
                      <>
                        <FiCheck size={16} /> Ruaj raportin
                      </>
                    )}
                  </button>
                  {canEditReportAndStatus && doctorCanCompleteVisit && (
                    <button
                      type="button"
                      disabled={statusSubmitting}
                      onClick={() => handleStatusChange("Finished")}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-slate-700 text-slate-800 bg-white text-sm font-semibold rounded-md hover:bg-slate-50 disabled:opacity-50"
                    >
                      Përfundo vizitën
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="divide-y divide-slate-100">
                <div className="px-5 py-3">
                  <p className="text-xs text-slate-500 mb-1">Anamneza</p>
                  <p className="text-sm text-slate-900 whitespace-pre-wrap">
                    {medicalReport?.anamneza ?? medicalReport?.Anamneza ?? "—"}
                  </p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-xs text-slate-500 mb-1">Diagnoza</p>
                  <p className="text-sm text-slate-900 whitespace-pre-wrap">
                    {medicalReport?.diagnosis ?? medicalReport?.Diagnosis ?? "—"}
                  </p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-xs text-slate-500 mb-1">Terapia</p>
                  <p className="text-sm text-slate-900 whitespace-pre-wrap">
                    {medicalReport?.therapy ?? medicalReport?.Therapy ?? "—"}
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="border-t border-slate-200">
            <h4 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <FiImage size={12} aria-hidden />
              Nënshkrimi dhe vula
            </h4>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border border-slate-200 rounded-md p-3 bg-slate-50/40">
                <p className="text-[10px] font-medium text-slate-500 uppercase mb-2">Nënshkrimi</p>
                {doctorProfileLoading ? (
                  <p className="text-sm text-slate-500 animate-pulse">…</p>
                ) : signaturePreviewUrl ? (
                  <img
                    src={signaturePreviewUrl}
                    alt="Nënshkrimi"
                    className="max-h-20 object-contain"
                  />
                ) : (
                  <p className="text-sm text-slate-500">—</p>
                )}
              </div>
              <div className="border border-slate-200 rounded-md p-3 bg-slate-50/40">
                <p className="text-[10px] font-medium text-slate-500 uppercase mb-2">Vula</p>
                {doctorProfileLoading ? (
                  <p className="text-sm text-slate-500 animate-pulse">…</p>
                ) : stampPreviewUrl ? (
                  <img src={stampPreviewUrl} alt="Vula" className="max-h-20 object-contain" />
                ) : (
                  <p className="text-sm text-slate-500">—</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
