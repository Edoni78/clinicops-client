import React from "react";
import { FiActivity, FiSkipForward } from "react-icons/fi";
import VitalsReadonlyGrid from "../../../../components/vitals/VitalsReadonlyGrid";
import {
  DEFAULT_VITAL_PREFERENCES,
  hasAnyVitalPreferenceEnabled,
} from "../../../../utils/vitalPreferences";

export default function NurseSection({
  canEditVitals,
  vitals,
  setVitals,
  handleSubmitVitals,
  handleSkipVitals,
  vitalsSubmitting,
  latestVitals,
  vitalPreferences = DEFAULT_VITAL_PREFERENCES,
  caseStatus,
}) {
  const prefs = vitalPreferences || DEFAULT_VITAL_PREFERENCES;
  const vitalsEnabled = hasAnyVitalPreferenceEnabled(prefs);
  const busy = vitalsSubmitting;

  return (
    <div className="card overflow-hidden mb-6">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <FiActivity className="text-slate-500" size={15} aria-hidden />
          Infermieri
        </h2>
      </div>

      <div className="p-5 space-y-5">
        {caseStatus === "InConsultation" && (
          <p className="text-sm text-slate-700 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
            Pacienti është te mjeku. Kur vizita përfundon, rasti shfaqet te «Për mbyllje».
          </p>
        )}
        {caseStatus === "Finished" && (
          <p className="text-sm text-indigo-950 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2.5">
            Mjeku përfundoi vizitën. Raporti është këtu — printoni dhe mbyllni rastin.
          </p>
        )}
        {caseStatus === "Mbyllur" && (
          <p className="text-sm text-slate-700 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
            Rasti është i mbyllur.
          </p>
        )}

        <section>
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
            Shenjat jetësore
          </h3>

          {!vitalsEnabled ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
                Klinika nuk përdor regjistrimin e shenjave vitale.
              </p>
              {canEditVitals && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleSkipVitals}
                  className="btn-primary btn-md"
                >
                  {busy ? "Duke dërguar…" : "Dërgo te mjeku"}
                </button>
              )}
            </div>
          ) : canEditVitals ? (
            <form onSubmit={handleSubmitVitals} className="space-y-4">
              <p className="text-xs text-slate-500">
                Matni shenjat që keni, pastaj dërgoni pacientin te mjeku. Nëse nuk ka matje, dërgoni pa shenja.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-3">
                {prefs.enableWeight && (
                  <div className="sm:col-span-1 xl:col-span-4">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Pesha (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={vitals.weightKg}
                      onChange={(e) => setVitals((p) => ({ ...p, weightKg: e.target.value }))}
                      className="input"
                    />
                  </div>
                )}
                {prefs.enableBloodPressure && (
                  <div className="sm:col-span-2 xl:col-span-4">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Presioni (mmHg)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min="0"
                        value={vitals.systolicPressure}
                        onChange={(e) =>
                          setVitals((p) => ({ ...p, systolicPressure: e.target.value }))
                        }
                        className="input"
                        placeholder="Sistolike"
                        aria-label="Sistolike (mmHg)"
                      />
                      <input
                        type="number"
                        min="0"
                        value={vitals.diastolicPressure}
                        onChange={(e) =>
                          setVitals((p) => ({ ...p, diastolicPressure: e.target.value }))
                        }
                        className="input"
                        placeholder="Diastolike"
                        aria-label="Diastolike (mmHg)"
                      />
                    </div>
                  </div>
                )}
                {prefs.enableTemperature && (
                  <div className="sm:col-span-1 xl:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Temperatura (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={vitals.temperatureC}
                      onChange={(e) => setVitals((p) => ({ ...p, temperatureC: e.target.value }))}
                      className="input"
                    />
                  </div>
                )}
                {prefs.enableHeartRate && (
                  <div className="sm:col-span-1 xl:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Rrahjet (bpm)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={vitals.heartRate}
                      onChange={(e) => setVitals((p) => ({ ...p, heartRate: e.target.value }))}
                      className="input"
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-primary btn-md"
                >
                  {busy ? "Duke dërguar…" : "Dërgo te mjeku"}
                </button>
                {handleSkipVitals && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleSkipVitals}
                    className="btn-secondary btn-md"
                  >
                    <FiSkipForward size={16} />
                    Dërgo pa shenja
                  </button>
                )}
              </div>
            </form>
          ) : (
            <VitalsReadonlyGrid vitals={latestVitals} vitalPreferences={prefs} />
          )}
        </section>
      </div>
    </div>
  );
}
