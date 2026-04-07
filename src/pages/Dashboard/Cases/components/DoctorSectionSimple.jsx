import React from "react";
import { FiActivity, FiCheck, FiDownload, FiFileText, FiImage, FiUser } from "react-icons/fi";

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

  const doctorUiStatuses = doctorNextStatuses.filter((s) => s !== "Finished");
  const doctorStatusOrder = { InConsultation: 0, Completed: 1 };
  const sortDoctorStatuses = (arr) =>
    [...arr].sort((a, b) => (doctorStatusOrder[a] ?? 99) - (doctorStatusOrder[b] ?? 99));

  const doctorCanCompleteVisit = doctorUiStatuses.includes("Completed");
  const doctorHeaderStatuses = sortDoctorStatuses(
    canEditReportAndStatus ? doctorUiStatuses.filter((s) => s !== "Completed") : doctorUiStatuses
  );

  const doctorActionLabel = (s) => {
    if (s === "InConsultation") return "Fillo konsultimin";
    if (s === "Completed") return "Përfundo vizitën";
    return s;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-7">
      <div className="px-6 sm:px-7 pt-6 sm:pt-7 pb-6 border-b border-slate-100 bg-gradient-to-br from-slate-50/90 to-white">
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#81a2c5]/12 text-[#81a2c5] shrink-0">
                <FiFileText className="text-xl" aria-hidden />
              </span>
              <span>Mjeku – Konsultimi dhe raporti</span>
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl pl-0 sm:pl-[3.25rem]">
              {isSoloDoctorClinic
                ? "Vendosni diagnozën dhe terapiën dhe përfundoni vizitën."
                : "Shenjat jetësore përditësohen në kohë reale. Vendosni diagnozën dhe terapiën dhe përfundoni vizitën."}
            </p>
          </div>

          {!isSoloDoctorClinic && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)] overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/80">
                <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                  <FiActivity className="text-[#81a2c5] text-sm" aria-hidden />
                  Shenjat jetësore (nga infermieri)
                </h3>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-slate-100 bg-slate-50/40 px-3 py-2.5"><p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Pesha</p><p className="mt-0.5 font-semibold text-slate-900 tabular-nums">{(latestVitals?.weightKg ?? latestVitals?.WeightKg) != null ? `${latestVitals?.weightKg ?? latestVitals?.WeightKg} kg` : "—"}</p></div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/40 px-3 py-2.5"><p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Presioni</p><p className="mt-0.5 font-semibold text-slate-900 tabular-nums">{(latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure) != null && (latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure) != null ? `${latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure} / ${latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure}` : "—"}</p></div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/40 px-3 py-2.5"><p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Temperatura</p><p className="mt-0.5 font-semibold text-slate-900 tabular-nums">{(latestVitals?.temperatureC ?? latestVitals?.TemperatureC) != null ? `${latestVitals?.temperatureC ?? latestVitals?.TemperatureC} °C` : "—"}</p></div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/40 px-3 py-2.5"><p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Rrahjet</p><p className="mt-0.5 font-semibold text-slate-900 tabular-nums">{(latestVitals?.heartRate ?? latestVitals?.HeartRate) != null ? `${latestVitals?.heartRate ?? latestVitals?.HeartRate} bpm` : "—"}</p></div>
              </div>
            </div>
          )}

          {doctorHeaderStatuses.length > 0 && (
            <div className="rounded-xl border border-slate-200 border-dashed bg-slate-50/40">
              <div className="px-4 sm:px-5 py-3 border-b border-slate-200/80 bg-white/60">
                <h3 className="text-sm font-semibold text-slate-800">Veprimet e mjekut</h3>
                <p className="text-xs text-slate-500 mt-0.5">Përditësoni fazën e vizitës kur përputhet me rrjedhën klinike.</p>
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-sm font-medium text-slate-600 mb-3">Statusi (mjeku)</p>
                <div className="flex flex-wrap gap-2">
                  {doctorHeaderStatuses.map((s) => (
                    <button key={s} type="button" disabled={statusSubmitting} onClick={() => handleStatusChange(s)} className="px-4 py-2.5 bg-[#81a2c5] text-white text-sm font-semibold rounded-xl hover:bg-[#6b8fa8] disabled:opacity-50 transition-colors shadow-sm">
                      {doctorActionLabel(s)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="px-6 sm:px-7 py-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50 border-b border-slate-200">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
              <span className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#81a2c5] text-white shrink-0">
                <FiFileText size={18} aria-hidden />
              </span>
              Raporti mjekësor
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 sm:ml-11">Shkarkoni PDF-in nga serveri (i njëjtë si në raporte).</p>
          </div>
          <button type="button" onClick={handleDownloadReportPdf} className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-800 text-sm font-semibold rounded-xl transition-colors border border-slate-200 shadow-sm hover:border-[#81a2c5]/50 hover:text-[#5a7a94]">
            <FiDownload size={18} aria-hidden />
            Shkarko PDF
          </button>
        </div>

        <div className="p-0 bg-white">
          <section className="border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2"><FiUser size={14} />Pacienti dhe rasti</h3>
            <div className="divide-y divide-slate-200">
              {[{ label: "Emri", value: patientDisplayName }, { label: "Gjinia", value: patientGender }, { label: "Numri i telefonit", value: patientPhone }, { label: "Data e lindjes", value: formatDateDisplay(patientDob) }, { label: "Statusi", value: caseData.status ?? caseData.Status }].map(({ label, value }) => (
                <div key={label} className="flex flex-wrap items-baseline justify-between gap-4 px-6 py-3"><span className="text-sm text-slate-500">{label}</span><span className="text-sm font-medium text-slate-900 text-right">{value}</span></div>
              ))}
            </div>
          </section>

          {!isSoloDoctorClinic && (
            <section className="border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2"><FiActivity size={14} />Shenjat jetësore</h3>
              <div className="divide-y divide-slate-200">
                {[{ label: "Pesha", value: (latestVitals?.weightKg ?? latestVitals?.WeightKg) != null ? `${latestVitals?.weightKg ?? latestVitals?.WeightKg} kg` : "—" }, { label: "Presioni i gjakut", value: (latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure) != null && (latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure) != null ? `${latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure} / ${latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure} mmHg` : "—" }, { label: "Temperatura", value: (latestVitals?.temperatureC ?? latestVitals?.TemperatureC) != null ? `${latestVitals?.temperatureC ?? latestVitals?.TemperatureC} °C` : "—" }, { label: "Rrahjet e zemrës", value: (latestVitals?.heartRate ?? latestVitals?.HeartRate) != null ? `${latestVitals?.heartRate ?? latestVitals?.HeartRate} bpm` : "—" }].map(({ label, value }) => (
                  <div key={label} className="flex flex-wrap items-baseline justify-between gap-4 px-6 py-3"><span className="text-sm text-slate-500">{label}</span><span className="text-sm font-medium text-slate-900 text-right">{value}</span></div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2"><FiFileText size={14} />Shënime klinike</h3>
            {canEditReportAndStatus ? (
              <form onSubmit={handleSubmitReport} className="p-7 space-y-5">
                <div className="border-b border-slate-200 pb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Shërbimi i rastit</label>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <select
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      disabled={servicesLoading || serviceSubmitting}
                      className="w-full sm:max-w-md px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent bg-white"
                    >
                      <option value="">{servicesLoading ? "Duke ngarkuar shërbimet..." : "Zgjidh shërbimin"}</option>
                      {services.map((s) => {
                        const sid = s.id ?? s.Id;
                        const name = s.name ?? s.Name ?? "—";
                        const price = s.price ?? s.Price;
                        return (
                          <option key={sid} value={sid}>
                            {name} {typeof price === "number" ? `- ${price.toFixed(2)} EUR` : ""}
                          </option>
                        );
                      })}
                    </select>
                    <button
                      type="button"
                      disabled={serviceSubmitting || !selectedServiceId}
                      onClick={handleAttachService}
                      className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm"
                    >
                      {serviceSubmitting ? "Duke ruajtur..." : "Ruaj shërbimin"}
                    </button>
                  </div>
                  {attachedServiceName && (
                    <p className="text-xs text-slate-500 mt-2">
                      Shërbimi aktual: <span className="font-medium text-slate-700">{attachedServiceName}</span>
                      {attachedServicePrice != null ? ` (${Number(attachedServicePrice).toFixed(2)} EUR)` : ""}
                    </p>
                  )}
                </div>
                <div className="border-b border-slate-200 pb-4"><label className="block text-sm font-medium text-slate-700 mb-2">Anamneza</label><textarea value={report.anamneza} onChange={(e) => setReport((p) => ({ ...p, anamneza: e.target.value }))} rows={3} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent" placeholder="Historia e sëmundjes, anamneza..." /></div>
                <div className="border-b border-slate-200 pb-4"><label className="block text-sm font-medium text-slate-700 mb-2">Diagnoza *</label><textarea value={report.diagnosis} onChange={(e) => setReport((p) => ({ ...p, diagnosis: e.target.value }))} rows={3} required className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent" placeholder="Vendosni diagnozën..." /></div>
                <div className="border-b border-slate-200 pb-4"><label className="block text-sm font-medium text-slate-700 mb-2">Terapia *</label><textarea value={report.therapy} onChange={(e) => setReport((p) => ({ ...p, therapy: e.target.value }))} rows={3} required className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent" placeholder="Vendosni terapi / recetë..." /></div>
                <div className="flex flex-col items-start gap-3 pt-1">
                  <button type="submit" disabled={reportSubmitting} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#81a2c5] text-white font-semibold rounded-xl hover:bg-[#6b8fa8] disabled:opacity-50 transition-colors shadow-sm">{reportSubmitting ? <span className="animate-pulse">Duke ruajtur…</span> : <><FiCheck size={18} /> Ruaj raportin</>}</button>
                  {canEditReportAndStatus && doctorCanCompleteVisit && (
                    <button
                      type="button"
                      disabled={statusSubmitting}
                      onClick={() => handleStatusChange("Completed")}
                      className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-slate-700 text-slate-800 bg-white font-semibold rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
                    >
                      Përfundo vizitën
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="divide-y divide-slate-200">
                <div className="px-6 py-4"><p className="text-sm text-slate-500 mb-2">Anamneza</p><p className="text-slate-900 whitespace-pre-wrap">{medicalReport?.anamneza ?? medicalReport?.Anamneza ?? "—"}</p></div>
                <div className="px-6 py-4"><p className="text-sm text-slate-500 mb-2">Diagnoza</p><p className="text-slate-900 whitespace-pre-wrap">{medicalReport?.diagnosis ?? medicalReport?.Diagnosis ?? "—"}</p></div>
                <div className="px-6 py-4"><p className="text-sm text-slate-500 mb-2">Terapia</p><p className="text-slate-900 whitespace-pre-wrap">{medicalReport?.therapy ?? medicalReport?.Therapy ?? "—"}</p></div>
              </div>
            )}
          </section>

          <section className="border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2"><FiImage size={14} />Nënshkrimi dhe vula e mjekut</h3>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <p className="text-xs text-slate-500 mb-2">Nënshkrimi</p>
                {doctorProfileLoading ? <p className="text-sm text-slate-500 animate-pulse">Duke ngarkuar…</p> : signaturePreviewUrl ? <img src={signaturePreviewUrl} alt="Nënshkrimi i mjekut" className="max-h-24 object-contain" /> : <p className="text-sm text-slate-500 italic">Nuk ka nënshkrim të ngarkuar te Profili i mjekut.</p>}
              </div>
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <p className="text-xs text-slate-500 mb-2">Vula</p>
                {doctorProfileLoading ? <p className="text-sm text-slate-500 animate-pulse">Duke ngarkuar…</p> : stampPreviewUrl ? <img src={stampPreviewUrl} alt="Vula e mjekut" className="max-h-24 object-contain" /> : <p className="text-sm text-slate-500 italic">Nuk ka vulë të ngarkuar te Profili i mjekut.</p>}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
