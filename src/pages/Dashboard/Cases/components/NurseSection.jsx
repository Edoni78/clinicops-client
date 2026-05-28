import React from "react";
import { FiActivity, FiCheck } from "react-icons/fi";

const inputClass =
  "w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:ring-2 focus:ring-clinic-400/30 focus:border-clinic-400 outline-none";

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
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6">
      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 border-l-4 border-l-clinic-400">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <FiActivity className="text-clinic-400" size={16} aria-hidden />
          Infermieri
        </h2>
      </div>

      <div className="p-5 space-y-5">
        <section>
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
            Shenjat jetësore
          </h3>
          {canEditVitals ? (
            <form onSubmit={handleSubmitVitals} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-3">
                <div className="sm:col-span-1 xl:col-span-4">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Pesha (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={vitals.weightKg}
                    onChange={(e) => setVitals((p) => ({ ...p, weightKg: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2 xl:col-span-4">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Presioni (mmHg)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      value={vitals.systolicPressure}
                      onChange={(e) => setVitals((p) => ({ ...p, systolicPressure: e.target.value }))}
                      className={inputClass}
                      placeholder="Sistolike"
                      aria-label="Sistolike (mmHg)"
                    />
                    <input
                      type="number"
                      min="0"
                      value={vitals.diastolicPressure}
                      onChange={(e) => setVitals((p) => ({ ...p, diastolicPressure: e.target.value }))}
                      className={inputClass}
                      placeholder="Diastolike"
                      aria-label="Diastolike (mmHg)"
                    />
                  </div>
                </div>
                <div className="sm:col-span-1 xl:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Temperatura (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitals.temperatureC}
                    onChange={(e) => setVitals((p) => ({ ...p, temperatureC: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-1 xl:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Rrahjet (bpm)</label>
                  <input
                    type="number"
                    min="0"
                    value={vitals.heartRate}
                    onChange={(e) => setVitals((p) => ({ ...p, heartRate: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={vitalsSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-clinic-400 text-white text-sm font-semibold rounded-md hover:bg-clinic-500 disabled:opacity-50 transition-colors"
              >
                {vitalsSubmitting ? (
                  <span className="animate-pulse">Duke ruajtur…</span>
                ) : (
                  <>
                    <FiCheck size={16} /> Ruaj
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                <p className="text-[10px] font-medium text-slate-500 uppercase">Pesha</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900 tabular-nums">
                  {(latestVitals?.weightKg ?? latestVitals?.WeightKg) != null
                    ? `${latestVitals?.weightKg ?? latestVitals?.WeightKg} kg`
                    : "—"}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2.5 col-span-2 lg:col-span-1">
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
          )}
        </section>

        {nurseNextStatuses.length > 0 && (
          <section className="pt-4 border-t border-slate-200">
            <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
              Statusi
            </h3>
            <div className="flex flex-wrap gap-2">
              {nurseNextStatuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={statusSubmitting}
                  onClick={() => handleStatusChange(s)}
                  className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-700 disabled:opacity-50 transition-colors"
                >
                  {s === "InProgress" && "Kalo në progres"}
                  {s === "InConsultation" && "Dërgo te mjeku"}
                  {!["InProgress", "InConsultation"].includes(s) && s}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
