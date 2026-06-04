import React from "react";
import { FiActivity, FiCheck, FiDownload, FiFileText, FiImage, FiUser } from "react-icons/fi";

export default function DoctorSection(props) {
  const {
    reportPdfRef,
    isSoloDoctorClinic,
    latestVitals,
    doctorNextStatuses,
    statusSubmitting,
    handleStatusChange,
    handleDownloadReportPdf,
    clinicLogoUrl,
    clinicName,
    clinicAddress,
    clinicPhone,
    clinicEmail,
    clinicNui,
    reportDate,
    reportTime,
    doctorDisplayName,
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
          <FiFileText className="text-clinic-400" />
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
              <button key={s} type="button" disabled={statusSubmitting} onClick={() => handleStatusChange(s)} className="px-4 py-2 bg-clinic-400 text-white text-sm font-semibold rounded-xl hover:bg-clinic-500 disabled:opacity-50 transition-colors shadow-sm">
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

        {canEditReportAndStatus && (
          <form onSubmit={handleSubmitReport} className="p-5 border-b border-slate-200 bg-slate-50 space-y-3">
            <div><label className="block text-xs font-medium text-slate-700 mb-1.5">Anamneza</label><textarea value={report.anamneza} onChange={(e) => setReport((p) => ({ ...p, anamneza: e.target.value }))} rows={2} className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-clinic-400 focus:border-transparent" placeholder="Historia e sëmundjes, anamneza..." /></div>
            <div><label className="block text-xs font-medium text-slate-700 mb-1.5">Ekzaminimi</label><textarea value={report.ekzaminimi} onChange={(e) => setReport((p) => ({ ...p, ekzaminimi: e.target.value }))} rows={2} className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-clinic-400 focus:border-transparent" placeholder="Gjetjet e ekzaminimit..." /></div>
            <div><label className="block text-xs font-medium text-slate-700 mb-1.5">Diagnoza *</label><textarea value={report.diagnosis} onChange={(e) => setReport((p) => ({ ...p, diagnosis: e.target.value }))} rows={2} required className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-clinic-400 focus:border-transparent" placeholder="Vendosni diagnozën..." /></div>
            <div><label className="block text-xs font-medium text-slate-700 mb-1.5">Terapia *</label><textarea value={report.therapy} onChange={(e) => setReport((p) => ({ ...p, therapy: e.target.value }))} rows={2} required className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-clinic-400 focus:border-transparent" placeholder="Vendosni terapi / recetë..." /></div>
            <button type="submit" disabled={reportSubmitting} className="inline-flex items-center gap-2 px-5 py-2.5 bg-clinic-400 text-white font-semibold rounded-xl hover:bg-clinic-500 disabled:opacity-50 transition-colors shadow-sm">{reportSubmitting ? <span className="animate-pulse">Duke ruajtur…</span> : <><FiCheck size={18} /> Ruaj raportin</>}</button>
          </form>
        )}

        <div
          id="clinic-case-report"
          ref={reportPdfRef}
          style={{
            width: "210mm",
            minHeight: "297mm",
            margin: "0 auto",
            background: "#ffffff",
            color: "#1e293b",
            fontFamily: "Arial, sans-serif",
            boxSizing: "border-box",
            padding: "28px 30px 40px 30px",
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, borderBottom: "2px solid #dbeafe", paddingBottom: 18, marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div data-pdf-slot="clinic-logo" style={{ width: 78, height: 78, flexShrink: 0 }}>
                {clinicLogoUrl && (
                  <img data-pdf-image="clinic-logo" src={clinicLogoUrl} alt="Clinic Logo" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                )}
              </div>
              <div>
                <h1 style={{ margin: "0 0 6px 0", fontSize: 24, color: "#0f172a" }}>{clinicName}</h1>
                <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>{clinicAddress}</p>
                <p style={{ margin: "2px 0 0 0", fontSize: 13, color: "#475569" }}>Tel: {clinicPhone} | Email: {clinicEmail}</p>
                <p style={{ margin: "2px 0 0 0", fontSize: 13, color: "#475569" }}>Licenca / NUI: {clinicNui}</p>
              </div>
            </div>
            <div style={{ minWidth: 220, border: "1px solid #cbd5e1", borderRadius: 12, padding: "12px 14px", background: "#f8fafc" }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Detajet e raportit</div>
              <div style={{ fontSize: 13, color: "#0f172a", marginBottom: 4 }}>Data: {reportDate}</div>
              <div style={{ fontSize: 13, color: "#0f172a", marginBottom: 4 }}>Ora: {reportTime}</div>
              <div style={{ fontSize: 13, color: "#0f172a" }}>Mjeku: {doctorDisplayName}</div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 22, color: "#0f172a", letterSpacing: 0.4 }}>Raporti Mjekësor</h2>
            <p style={{ margin: "8px 0 0 0", fontSize: 13, color: "#64748b" }}>Dokumentim zyrtar klinik i konsultës së pacientit dhe gjetjeve mjekësore</p>
          </div>

          <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "12px 16px", fontSize: 14, color: "#0f172a" }}>Të dhënat e pacientit</div>
            {[
              ["Emri i pacientit", patientDisplayName],
              ["Gjinia", patientGender],
              ["Data e lindjes", formatDateDisplay(patientDob)],
              ["Numri i telefonit", patientPhone],
              ["Statusi i rastit", caseData.status ?? caseData.Status],
            ].map(([label, val], idx) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 20, padding: "12px 16px", borderBottom: idx === 4 ? "none" : "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>{label}</span>
                <span style={{ fontSize: 13, color: "#0f172a" }}>{val}</span>
              </div>
            ))}
          </div>

          {!isSoloDoctorClinic && (
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
              <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "12px 16px", fontSize: 14, color: "#0f172a" }}>Shenjat vitale</div>
              <div style={{ padding: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                  {[["Pesha", `${latestVitals?.weightKg ?? latestVitals?.WeightKg ?? "—"} kg`], ["Presioni i gjakut", (latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure) != null && (latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure) != null ? `${latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure} / ${latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure}` : "—"], ["Temperatura", `${latestVitals?.temperatureC ?? latestVitals?.TemperatureC ?? "—"} °C`], ["Rrahjet e zemrës", `${latestVitals?.heartRate ?? latestVitals?.HeartRate ?? "—"} bpm`]].map(([k, v]) => (
                    <div key={k} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{k}</div>
                      <div style={{ fontSize: 14, color: "#0f172a", marginTop: 4 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "12px 16px", fontSize: 14, color: "#0f172a" }}>Shënime klinike</div>
            <div style={{ padding: "18px 16px" }}>
              {[["Anamneza", report.anamneza || medicalReport?.anamneza || medicalReport?.Anamneza || "—"], ["Ekzaminimi", report.ekzaminimi || medicalReport?.ekzaminimi || medicalReport?.Ekzaminimi || "—"], ["Diagnoza", report.diagnosis || medicalReport?.diagnosis || medicalReport?.Diagnosis || "—"], ["Terapia / Rekomandimi", report.therapy || medicalReport?.therapy || medicalReport?.Therapy || "—"]].map(([k, v], idx) => (
                <div key={k} style={{ marginBottom: idx === 3 ? 0 : 18 }}>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>{k}</div>
                  <div style={{ fontSize: 14, color: "#0f172a", whiteSpace: "pre-wrap" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 36, paddingTop: 24, borderTop: "2px dashed #cbd5e1" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "end" }}>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, minHeight: 160 }}>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>Nënshkrimi i mjekut</div>
                <div style={{ height: 90, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div data-pdf-slot="doctor-signature">
                    {doctorProfileLoading ? <div /> : signaturePreviewUrl ? <img data-pdf-image="doctor-signature" src={signaturePreviewUrl} alt="Doctor Signature" style={{ maxWidth: "100%", maxHeight: 90, objectFit: "contain", display: "block" }} /> : <div />}
                  </div>
                </div>
                <div style={{ marginTop: 12, borderTop: "1px solid #cbd5e1", paddingTop: 8, textAlign: "center", fontSize: 13, color: "#0f172a" }}>{doctorDisplayName}</div>
              </div>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, minHeight: 160 }}>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>Vula zyrtare</div>
                <div style={{ height: 90, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div data-pdf-slot="doctor-stamp">
                    {doctorProfileLoading ? <div /> : stampPreviewUrl ? <img data-pdf-image="doctor-stamp" src={stampPreviewUrl} alt="Doctor Stamp" style={{ maxWidth: "100%", maxHeight: 90, objectFit: "contain", display: "block" }} /> : <div />}
                  </div>
                </div>
                <div style={{ marginTop: 12, borderTop: "1px solid #cbd5e1", paddingTop: 8, textAlign: "center", fontSize: 13, color: "#0f172a" }}>{clinicName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
