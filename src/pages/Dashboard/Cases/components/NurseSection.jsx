import React from "react";
import { FiActivity, FiCheck, FiChevronRight } from "react-icons/fi";

export default function NurseSection({
  canEditVitals,
  vitals,
  setVitals,
  handleSubmitVitals,
  vitalsSubmitting,
  latestVitals,
  nurseNextStatuses,
  statusSubmitting,
  handleStatusChange,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-7">
      <div className="px-6 sm:px-7 pt-6 sm:pt-7 pb-5 border-b border-slate-100 bg-gradient-to-br from-slate-50/90 to-white">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#81a2c5]/12 text-[#81a2c5] shrink-0">
                <FiActivity className="text-xl" aria-hidden />
              </span>
              <span>Infermieri</span>
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl pl-0 sm:pl-[3.25rem]">
              Hapi 1: regjistroni shenjat jetësore. Hapi 2: përditësoni statusin e radhës kur rasti të jetë gati për mjekun.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-7 space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]">
          <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#81a2c5] text-white text-xs font-bold shrink-0">
              1
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Shenjat jetësore</h3>
              <p className="text-xs text-slate-500 hidden sm:block">Plotësoni vlerat dhe ruani para se të ndryshoni statusin.</p>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            {canEditVitals ? (
              <form onSubmit={handleSubmitVitals} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-4">
                  <div className="sm:col-span-1 xl:col-span-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pesha (kg)</label>
                    <input type="number" step="0.1" min="0" value={vitals.weightKg} onChange={(e) => setVitals((p) => ({ ...p, weightKg: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent bg-white" />
                  </div>
                  <div className="sm:col-span-2 xl:col-span-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Presioni i gjakut (mmHg)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="sr-only">Sistolike</span>
                        <input type="number" min="0" value={vitals.systolicPressure} onChange={(e) => setVitals((p) => ({ ...p, systolicPressure: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent bg-white" placeholder="Sistolike" aria-label="Sistolike (mmHg)" />
                      </div>
                      <div>
                        <span className="sr-only">Diastolike</span>
                        <input type="number" min="0" value={vitals.diastolicPressure} onChange={(e) => setVitals((p) => ({ ...p, diastolicPressure: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent bg-white" placeholder="Diastolike" aria-label="Diastolike (mmHg)" />
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-1 xl:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Temperatura (°C)</label>
                    <input type="number" step="0.1" value={vitals.temperatureC} onChange={(e) => setVitals((p) => ({ ...p, temperatureC: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent bg-white" />
                  </div>
                  <div className="sm:col-span-1 xl:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Rrahjet e zemrës (bpm)</label>
                    <input type="number" min="0" value={vitals.heartRate} onChange={(e) => setVitals((p) => ({ ...p, heartRate: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent bg-white" />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button type="submit" disabled={vitalsSubmitting} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#81a2c5] text-white font-semibold rounded-xl hover:bg-[#6b8fa8] disabled:opacity-50 transition-colors shadow-sm">
                    {vitalsSubmitting ? <span className="animate-pulse">Duke ruajtur…</span> : <><FiCheck size={18} /> Ruaj shenjat jetësore</>}
                  </button>
                  <p className="text-xs text-slate-500">Ruajtja përditëson kartelën për mjekun në kohë reale.</p>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3"><p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pesha</p><p className="mt-1 text-base font-semibold text-slate-900 tabular-nums">{(latestVitals?.weightKg ?? latestVitals?.WeightKg) != null ? `${latestVitals?.weightKg ?? latestVitals?.WeightKg} kg` : "—"}</p></div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3 sm:col-span-2"><p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Presioni</p><p className="mt-1 text-base font-semibold text-slate-900 tabular-nums">{(latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure) != null && (latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure) != null ? `${latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure} / ${latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure} mmHg` : "—"}</p></div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3"><p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Temperatura</p><p className="mt-1 text-base font-semibold text-slate-900 tabular-nums">{(latestVitals?.temperatureC ?? latestVitals?.TemperatureC) != null ? `${latestVitals?.temperatureC ?? latestVitals?.TemperatureC} °C` : "—"}</p></div>
                <div className="rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3"><p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Rrahjet</p><p className="mt-1 text-base font-semibold text-slate-900 tabular-nums">{(latestVitals?.heartRate ?? latestVitals?.HeartRate) != null ? `${latestVitals?.heartRate ?? latestVitals?.HeartRate} bpm` : "—"}</p></div>
              </div>
            )}
          </div>
        </div>

        {nurseNextStatuses.length > 0 && (
          <div className="rounded-xl border border-slate-200 border-dashed bg-slate-50/40">
            <div className="px-4 sm:px-5 py-3 border-b border-slate-200/80 bg-white/60 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-700 text-white text-xs font-bold shrink-0">
                2
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  Radha dhe statusi
                  <FiChevronRight className="text-slate-400 shrink-0" aria-hidden />
                </h3>
                <p className="text-xs text-slate-500">Zgjidhni veprimin që përputhet me fazën aktuale të rastit.</p>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-sm font-medium text-slate-600 mb-3">Ndrysho statusin (infermieri)</p>
              <div className="flex flex-wrap gap-2">
                {nurseNextStatuses.map((s) => (
                  <button key={s} type="button" disabled={statusSubmitting} onClick={() => handleStatusChange(s)} className="px-4 py-2.5 bg-[#81a2c5] text-white text-sm font-semibold rounded-xl hover:bg-[#6b8fa8] disabled:opacity-50 transition-colors shadow-sm">
                    {s === "InProgress" && "Kalo në progres"}
                    {s === "InConsultation" && "Dërgo te mjeku"}
                    {!["InProgress", "InConsultation"].includes(s) && s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
