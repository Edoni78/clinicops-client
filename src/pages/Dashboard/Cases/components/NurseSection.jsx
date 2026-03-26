import React from "react";
import { FiActivity, FiCheck } from "react-icons/fi";

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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7 mb-7">
      <h2 className="text-lg font-semibold text-slate-900 mb-1 flex items-center gap-2">
        <FiActivity className="text-[#81a2c5]" />
        Infermieri – Shenjat jetësore dhe radha
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Vendosni shenjat jetësore dhe dërgoni rastin te mjeku kur gati.
      </p>

      {canEditVitals ? (
        <form onSubmit={handleSubmitVitals} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pesha (kg)</label>
              <input type="number" step="0.1" min="0" value={vitals.weightKg} onChange={(e) => setVitals((p) => ({ ...p, weightKg: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sistolike (mmHg)</label>
              <input type="number" min="0" value={vitals.systolicPressure} onChange={(e) => setVitals((p) => ({ ...p, systolicPressure: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Diastolike (mmHg)</label>
              <input type="number" min="0" value={vitals.diastolicPressure} onChange={(e) => setVitals((p) => ({ ...p, diastolicPressure: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Temperatura (°C)</label>
              <input type="number" step="0.1" value={vitals.temperatureC} onChange={(e) => setVitals((p) => ({ ...p, temperatureC: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rrahjet e zemrës (bpm)</label>
              <input type="number" min="0" value={vitals.heartRate} onChange={(e) => setVitals((p) => ({ ...p, heartRate: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent" />
            </div>
          </div>
          <button type="submit" disabled={vitalsSubmitting} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#81a2c5] text-white font-semibold rounded-xl hover:bg-[#6b8fa8] disabled:opacity-50 transition-colors shadow-sm">
            {vitalsSubmitting ? <span className="animate-pulse">Duke ruajtur…</span> : <><FiCheck size={18} /> Ruaj shenjat jetësore</>}
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div><p className="text-sm text-slate-500">Pesha (kg)</p><p className="font-medium text-slate-900">{(latestVitals?.weightKg ?? latestVitals?.WeightKg) != null ? (latestVitals?.weightKg ?? latestVitals?.WeightKg) : "—"}</p></div>
          <div><p className="text-sm text-slate-500">Presioni i gjakut</p><p className="font-medium text-slate-900">{(latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure) != null && (latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure) != null ? `${latestVitals?.systolicPressure ?? latestVitals?.SystolicPressure} / ${latestVitals?.diastolicPressure ?? latestVitals?.DiastolicPressure} mmHg` : "—"}</p></div>
          <div><p className="text-sm text-slate-500">Temperatura (°C)</p><p className="font-medium text-slate-900">{(latestVitals?.temperatureC ?? latestVitals?.TemperatureC) != null ? (latestVitals?.temperatureC ?? latestVitals?.TemperatureC) : "—"}</p></div>
          <div><p className="text-sm text-slate-500">Rrahjet e zemrës (bpm)</p><p className="font-medium text-slate-900">{(latestVitals?.heartRate ?? latestVitals?.HeartRate) != null ? (latestVitals?.heartRate ?? latestVitals?.HeartRate) : "—"}</p></div>
        </div>
      )}

      {nurseNextStatuses.length > 0 && (
        <div className="mt-5 pt-5 border-t border-slate-200">
          <p className="text-sm font-medium text-slate-600 mb-2">Ndrysho statusin (infermieri):</p>
          <div className="flex flex-wrap gap-2">
            {nurseNextStatuses.map((s) => (
              <button key={s} type="button" disabled={statusSubmitting} onClick={() => handleStatusChange(s)} className="px-4 py-2 bg-[#81a2c5] text-white text-sm font-semibold rounded-xl hover:bg-[#6b8fa8] disabled:opacity-50 transition-colors shadow-sm">
                {s === "InProgress" && "Kalo në progres"}
                {s === "InConsultation" && "Dërgo te mjeku"}
                {!["InProgress", "InConsultation"].includes(s) && s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
