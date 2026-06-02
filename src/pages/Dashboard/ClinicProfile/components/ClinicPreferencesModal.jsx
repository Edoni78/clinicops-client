import React, { useEffect, useState } from "react";
import { FiX, FiActivity, FiHash, FiDroplet } from "react-icons/fi";
import {
  DEFAULT_VITAL_PREFERENCES,
  parseVitalPreferences,
} from "../../../../utils/vitalPreferences";
import {
  DEFAULT_PROTOCOL_PREFERENCES,
  parseProtocolPreferences,
} from "../../../../utils/protocolPreferences";
import {
  COLOR_THEME_OPTIONS,
  DEFAULT_COLOR_THEME_PREFERENCES,
  getThemePreviewColors,
  parseColorThemePreferences,
} from "../../../../utils/colorThemePreferences";
import { updateClinicProfile } from "../../../../api/clinic";
import { useClinicTheme } from "../../../../context/ClinicThemeContext";

const VITAL_OPTIONS = [
  { key: "enableWeight", label: "Pesha" },
  { key: "enableBloodPressure", label: "Presioni i gjakut" },
  { key: "enableTemperature", label: "Temperatura" },
  { key: "enableHeartRate", label: "Rrahjet e zemrës" },
];

export default function ClinicPreferencesModal({ profile, open, onClose, onSaved, onError }) {
  const { setTheme, refreshFromProfile } = useClinicTheme();
  const [vitalPrefs, setVitalPrefs] = useState({ ...DEFAULT_VITAL_PREFERENCES });
  const [protocolPrefs, setProtocolPrefs] = useState({ ...DEFAULT_PROTOCOL_PREFERENCES });
  const [colorThemePrefs, setColorThemePrefs] = useState({ ...DEFAULT_COLOR_THEME_PREFERENCES });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !profile) return;
    setVitalPrefs(parseVitalPreferences(profile));
    setProtocolPrefs(parseProtocolPreferences(profile));
    setColorThemePrefs(parseColorThemePreferences(profile));
  }, [open, profile]);

  if (!open) return null;

  const handleClose = () => {
    if (profile) refreshFromProfile(profile);
    onClose();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated = await updateClinicProfile({
        vitalPreferences: vitalPrefs,
        protocolPreferences: protocolPrefs,
        colorThemePreferences: colorThemePrefs,
      });
      setTheme(colorThemePrefs.themeId);
      refreshFromProfile(updated);
      onSaved?.(updated);
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ??
        err.response?.data ??
        "Dështoi ruajtja e preferencave.";
      onError?.(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Preferencat</h3>
            <p className="text-sm text-slate-600 mt-0.5">
              Shenjat vitale, numri i protokollit dhe ngjyrat e sistemit.
            </p>
          </div>
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Mbyll"
          >
            <FiX size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          <section>
            <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <span className="inline-flex p-1.5 rounded-lg bg-clinic-100 text-clinic-600">
                <FiDroplet size={14} aria-hidden />
              </span>
              Ngjyrat e sistemit
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Zgjidhni paletën e ngjyrave për panelin, butonat dhe theksimet. Parazgjedhur është
              pamja aktuale blu-gri.
            </p>
            <div className="grid gap-2">
              {COLOR_THEME_OPTIONS.map((opt) => {
                const selected = colorThemePrefs.themeId === opt.id;
                const preview = getThemePreviewColors(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                      selected
                        ? "border-clinic-500 bg-clinic-50/80 ring-1 ring-clinic-300"
                        : "border-slate-200 bg-slate-50/60 hover:border-clinic-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="colorTheme"
                      className="sr-only"
                      checked={selected}
                      onChange={() => {
                        setColorThemePrefs({ themeId: opt.id });
                        setTheme(opt.id);
                      }}
                    />
                    <span
                      className="flex h-9 w-9 shrink-0 rounded-lg overflow-hidden border border-slate-200/80 shadow-sm"
                      aria-hidden
                    >
                      <span className="flex-1" style={{ background: preview.light }} />
                      <span className="flex-1" style={{ background: preview.main }} />
                      <span className="flex-1" style={{ background: preview.dark }} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-800">{opt.label}</span>
                      <span className="block text-xs text-slate-500">{opt.description}</span>
                    </span>
                    {selected && (
                      <span className="text-xs font-semibold text-clinic-700 shrink-0">Aktive</span>
                    )}
                  </label>
                );
              })}
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <span className="inline-flex p-1.5 rounded-lg bg-clinic-100 text-clinic-600">
                <FiActivity size={14} aria-hidden />
              </span>
              Shenjat vitale
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Zgjidhni cilat shenja infermieri mund të regjistrojë në rast.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {VITAL_OPTIONS.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 cursor-pointer hover:border-clinic-200"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-clinic-600 focus:ring-clinic-500"
                    checked={!!vitalPrefs[key]}
                    onChange={(ev) =>
                      setVitalPrefs((p) => ({ ...p, [key]: ev.target.checked }))
                    }
                  />
                  <span className="text-sm font-medium text-slate-800">{label}</span>
                </label>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <span className="inline-flex p-1.5 rounded-lg bg-clinic-100 text-clinic-600">
                <FiHash size={14} aria-hidden />
              </span>
              Numri i protokollit
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Kur aktivizohet, çdo rast duhet të ketë një numër unik protokolli para mbylljes.
              Teksti është i lirë; dy raste nuk mund të kenë të njëjtin numër në klinikë.
            </p>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 cursor-pointer hover:border-clinic-200 mb-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-clinic-600 focus:ring-clinic-500"
                checked={protocolPrefs.useProtocolNumber}
                onChange={(ev) =>
                  setProtocolPrefs((p) => ({
                    ...p,
                    useProtocolNumber: ev.target.checked,
                  }))
                }
              />
              <span className="text-sm font-medium text-slate-800">
                Përdor numrin e protokollit në raste dhe raporte
              </span>
            </label>
            {protocolPrefs.useProtocolNumber && (
              <div className="ml-1 pl-4 border-l-2 border-clinic-200 space-y-3">
                <p className="text-xs font-medium text-slate-600">Kush mund ta vendosë / ndryshojë?</p>
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-clinic-600"
                    checked={protocolPrefs.allowNurseToSet}
                    onChange={(ev) =>
                      setProtocolPrefs((p) => ({
                        ...p,
                        allowNurseToSet: ev.target.checked,
                      }))
                    }
                  />
                  <span className="text-sm text-slate-800">Infermieri</span>
                </label>
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-clinic-600"
                    checked={protocolPrefs.allowDoctorToSet}
                    onChange={(ev) =>
                      setProtocolPrefs((p) => ({
                        ...p,
                        allowDoctorToSet: ev.target.checked,
                      }))
                    }
                  />
                  <span className="text-sm text-slate-800">Mjeku</span>
                </label>
                {!protocolPrefs.allowNurseToSet && !protocolPrefs.allowDoctorToSet && (
                  <p className="text-xs text-amber-700">
                    Zgjidhni të paktën infermierin ose mjekun, përndryshe vetëm administratori
                    mund ta vendosë numrin.
                  </p>
                )}
              </div>
            )}
          </section>

          <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200">
            <button type="submit" disabled={submitting} className="btn-primary btn-md">
              {submitting ? "Duke ruajtur…" : "Ruaj preferencat"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="btn-secondary btn-md"
            >
              Anulo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
