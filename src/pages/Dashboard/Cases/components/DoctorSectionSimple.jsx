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
  } = props;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-7">
      <div className="p-7 pb-5">
        <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <FiFileText className="text-[#81a2c5]" />
          Mjeku – Konsultimi dhe raporti
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          {isSoloDoctorClinic
            ? "Vendosni diagnozën dhe terapiën dhe përfundoni vizitën."
            : "Shenjat jetësore përditësohen në kohë reale. Vendosni diagnozën dhe terapiën dhe përfundoni vizitën."}
        </p>

        {!isSoloDoctorClinic && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div><p className="text-xs text-slate-500">Pesha</p><p className="font-medium text-slate-900">{(latestVitals?.weightKg ?? latestVitals?.WeightKg) != null ? `${latestVitals?.weightKg ?? latestVitals?.WeightKg} kg` : "—"}</p></div>
            <div><p className="text-xs text-slate-500">Presioni</p><p className="font-medium text-slate-900">{(latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure) != null && (latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure) != null ? `${latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure}/${latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure}` : "—"}</p></div>
            <div><p className="text-xs text-slate-500">Temperatura</p><p className="font-medium text-slate-900">{(latestVitals?.temperatureC ?? latestVitals?.TemperatureC) != null ? `${latestVitals?.temperatureC ?? latestVitals?.TemperatureC} °C` : "—"}</p></div>
            <div><p className="text-xs text-slate-500">Rrahjet</p><p className="font-medium text-slate-900">{(latestVitals?.heartRate ?? latestVitals?.HeartRate) != null ? `${latestVitals?.heartRate ?? latestVitals?.HeartRate} bpm` : "—"}</p></div>
          </div>
        )}

        {doctorNextStatuses.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-slate-600 mr-2">Statusi (mjeku):</span>
            {doctorNextStatuses.map((s) => (
              <button key={s} type="button" disabled={statusSubmitting} onClick={() => handleStatusChange(s)} className="px-4 py-2 bg-[#81a2c5] text-white text-sm font-semibold rounded-xl hover:bg-[#6b8fa8] disabled:opacity-50 transition-colors shadow-sm">
                {s === "InConsultation" && "Fillo konsultimin"}
                {s === "Completed" && "Përfundo vizitën"}
                {s === "Finished" && "Mbyll vizitën"}
                {!["InConsultation", "Completed", "Finished"].includes(s) && s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200">
        <div className="bg-slate-900 px-7 py-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FiFileText size={22} />
            Raporti mjekësor
          </h2>
          <button type="button" onClick={handleDownloadReportPdf} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-colors border border-white/20">
            <FiDownload size={18} />
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
                <div className="border-b border-slate-200 pb-4"><label className="block text-sm font-medium text-slate-700 mb-2">Anamneza</label><textarea value={report.anamneza} onChange={(e) => setReport((p) => ({ ...p, anamneza: e.target.value }))} rows={3} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent" placeholder="Historia e sëmundjes, anamneza..." /></div>
                <div className="border-b border-slate-200 pb-4"><label className="block text-sm font-medium text-slate-700 mb-2">Diagnoza *</label><textarea value={report.diagnosis} onChange={(e) => setReport((p) => ({ ...p, diagnosis: e.target.value }))} rows={3} required className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent" placeholder="Vendosni diagnozën..." /></div>
                <div className="border-b border-slate-200 pb-4"><label className="block text-sm font-medium text-slate-700 mb-2">Terapia *</label><textarea value={report.therapy} onChange={(e) => setReport((p) => ({ ...p, therapy: e.target.value }))} rows={3} required className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent" placeholder="Vendosni terapi / recetë..." /></div>
                <button type="submit" disabled={reportSubmitting} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#81a2c5] text-white font-semibold rounded-xl hover:bg-[#6b8fa8] disabled:opacity-50 transition-colors shadow-sm">{reportSubmitting ? <span className="animate-pulse">Duke ruajtur…</span> : <><FiCheck size={18} /> Ruaj raportin</>}</button>
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
