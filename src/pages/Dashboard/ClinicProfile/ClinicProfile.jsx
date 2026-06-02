import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMapPin,
  FiPhone,
  FiEdit2,
  FiCheck,
  FiX,
  FiBriefcase,
  FiFileText,
  FiImage,
  FiUpload,
  FiSettings,
} from "react-icons/fi";
import ClinicPreferencesModal from "./components/ClinicPreferencesModal";
import Notification from "../../../components/ui/Notification";
import PageHeader from "../../../components/ui/PageHeader";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import EmptyState from "../../../components/ui/EmptyState";
import {
  getClinicProfile,
  updateClinicProfile,
  uploadClinicLogo,
  getLogoFullUrl,
} from "../../../api/clinic";
import { useAuth } from "../../../context/AuthContext";

const ALLOWED_LOGO_TYPES = ".jpg,.jpeg,.png,.gif,.webp";

function getInitials(name) {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function InfoField({ icon: Icon, label, value, emptyText = "Nuk është vendosur" }) {
  const hasValue = value && value !== "—";
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex p-2 rounded-lg bg-white border border-slate-200/80 text-clinic-600 shrink-0 shadow-sm">
          <Icon size={18} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
          <p className={`text-sm sm:text-base leading-relaxed ${hasValue ? "text-slate-900 font-medium" : "text-slate-400 italic"}`}>
            {hasValue ? value : emptyText}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ClinicProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const clinicId = user?.clinicId ?? user?.ClinicId;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [notif, setNotif] = useState({ visible: false, type: "info", message: "" });

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    description: "",
  });
  const [prefsModalOpen, setPrefsModalOpen] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const hasClinic = !!clinicId;

  const fetchProfile = useCallback(async () => {
    if (!hasClinic) return;
    setLoading(true);
    try {
      const data = await getClinicProfile();
      setProfile(data);
      const n = data?.name ?? data?.Name ?? "";
      const a = data?.address ?? data?.Address ?? "";
      const p = data?.phone ?? data?.Phone ?? "";
      const d = data?.description ?? data?.Description ?? "";
      setForm({ name: n, address: a, phone: p, description: d });
    } catch (err) {
      const msg =
        err.response?.data?.message ??
        err.response?.data ??
        "Dështoi ngarkimi i profilit të klinikës.";
      setNotif({ visible: true, type: "error", message: msg });
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [hasClinic]);

  useEffect(() => {
    if (!hasClinic) {
      navigate("/dashboard", { replace: true });
      return;
    }
    fetchProfile();
  }, [hasClinic, fetchProfile, navigate]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const showNotif = (type, message) => {
    setNotif({ visible: true, type, message });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (logoFile) {
        const updated = await uploadClinicLogo(logoFile);
        setProfile(updated);
        setLogoFile(null);
      }
      const payload = {
        name: form.name.trim() || undefined,
        address: form.address.trim() || undefined,
        phone: form.phone.trim() || undefined,
        description: form.description.trim() || undefined,
      };
      if (Object.keys(payload).some((k) => payload[k] != null)) {
        const updated = await updateClinicProfile(payload);
        setProfile(updated);
      }
      showNotif("success", "Profili i klinikës u ruajt.");
      setEditing(false);
      fetchProfile();
    } catch (err) {
      showNotif(
        "error",
        err.response?.data?.message ?? err.response?.data ?? "Dështoi ruajtja e profilit."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setLogoFile(null);
    if (profile) {
      const n = profile.name ?? profile.Name ?? "";
      const a = profile.address ?? profile.Address ?? "";
      const p = profile.phone ?? profile.Phone ?? "";
      const d = profile.description ?? profile.Description ?? "";
      setForm({ name: n, address: a, phone: p, description: d });
    }
  };

  if (!hasClinic) return null;

  const logoUrl = profile?.logoUrl ?? profile?.LogoUrl;
  const fullLogoUrl = getLogoFullUrl(logoUrl);
  const displayName = profile?.name ?? profile?.Name ?? "—";
  const displayAddress = profile?.address ?? profile?.Address ?? "—";
  const displayPhone = profile?.phone ?? profile?.Phone ?? "—";
  const displayDescription = profile?.description ?? profile?.Description ?? "";

  const headerActions = !loading && profile && !editing && (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setPrefsModalOpen(true)}
        className="btn-secondary btn-md"
      >
        <FiSettings size={16} aria-hidden />
        Preferencat
      </button>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="btn-primary btn-md"
      >
        <FiEdit2 size={16} aria-hidden />
        Ndrysho profilin
      </button>
    </div>
  );

  return (
    <>
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((p) => ({ ...p, visible: false }))}
      />

      <div className="page-shell max-w-4xl">
        <PageHeader
          title="Profili i klinikës"
          subtitle="Identiteti dhe informacioni i kontaktit të klinikës — shfaqen në panel, raporte dhe dokumente."
          icon={FiBriefcase}
          actions={headerActions}
        />

        <ClinicPreferencesModal
          profile={profile}
          open={prefsModalOpen}
          onClose={() => setPrefsModalOpen(false)}
          onSaved={(updated) => {
            setProfile(updated);
            showNotif("success", "Preferencat u ruajtën.");
          }}
          onError={(msg) => showNotif("error", msg)}
        />

        {loading ? (
          <LoadingSpinner className="py-16" label="Duke ngarkuar profilin…" />
        ) : !profile ? (
          <div className="card">
            <EmptyState
              icon={FiBriefcase}
              title="Profili nuk u ngarkua"
              description="Nuk mund të ngarkohet profili i klinikës. Provoni të rifreskoni faqen."
            />
          </div>
        ) : editing ? (
          <div className="space-y-6">
            <div className="card-padded">
              <div className="flex items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-200">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Ndrysho karten e klinikës</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Përditësoni të dhënat që shfaqen në raporte dhe në panel.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-8">
                <section>
                  <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="inline-flex p-1.5 rounded-lg bg-clinic-100 text-clinic-600">
                      <FiBriefcase size={14} aria-hidden />
                    </span>
                    Informacioni bazë
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label htmlFor="clinic-name" className="label">Emri i klinikës *</label>
                      <input
                        id="clinic-name"
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        required
                        maxLength={200}
                        className="input"
                        placeholder="Emri i klinikës"
                      />
                    </div>
                    <div>
                      <label htmlFor="clinic-address" className="label">Adresa</label>
                      <input
                        id="clinic-address"
                        type="text"
                        value={form.address}
                        onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                        maxLength={300}
                        className="input"
                        placeholder="Rruga, qyteti, kodi postar"
                      />
                    </div>
                    <div>
                      <label htmlFor="clinic-phone" className="label">Telefoni</label>
                      <input
                        id="clinic-phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                        maxLength={50}
                        className="input"
                        placeholder="+383 XX XXX XXX"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="inline-flex p-1.5 rounded-lg bg-clinic-100 text-clinic-600">
                      <FiFileText size={14} aria-hidden />
                    </span>
                    Përshkrimi
                  </h3>
                  <label htmlFor="clinic-description" className="label">Rreth klinikës</label>
                  <textarea
                    id="clinic-description"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    rows={4}
                    maxLength={2000}
                    className="input resize-none"
                    placeholder="Shërbimet, specializimet ose një përshkrim i shkurtër…"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">
                    {form.description.length}/2000 karaktere
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="inline-flex p-1.5 rounded-lg bg-clinic-100 text-clinic-600">
                      <FiImage size={14} aria-hidden />
                    </span>
                    Logotipi
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-5 items-start">
                    <div className="shrink-0">
                      {(logoPreview || fullLogoUrl) ? (
                        <img
                          src={logoPreview || fullLogoUrl}
                          alt="Parapamje e logotipit"
                          className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white shadow-card-md border border-slate-200"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-clinic-100 flex items-center justify-center ring-4 ring-white shadow-card-md border border-slate-200">
                          <span className="text-2xl font-bold text-clinic-500">
                            {getInitials(form.name || displayName)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor="clinic-logo"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:border-clinic-300 cursor-pointer transition-colors"
                      >
                        <FiUpload size={16} aria-hidden />
                        Zgjidhni logotip të ri
                      </label>
                      <input
                        id="clinic-logo"
                        type="file"
                        accept={ALLOWED_LOGO_TYPES}
                        onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                        className="sr-only"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        JPG, PNG, GIF ose WebP. Rekomandohet raport 1:1, minimum 200×200 px.
                      </p>
                      {logoFile && (
                        <p className="text-xs text-emerald-600 mt-1.5 font-medium">
                          Skedar i zgjedhur: {logoFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200">
                  <button type="submit" disabled={submitting} className="btn-primary btn-md">
                    <FiCheck size={18} aria-hidden />
                    {submitting ? "Duke ruajtur…" : "Ruaj ndryshimet"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={submitting}
                    className="btn-secondary btn-md"
                  >
                    <FiX size={18} aria-hidden />
                    Anulo
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Identity hero */}
            <div className="card overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="relative shrink-0 sm:w-52 bg-gradient-to-br from-clinic-700 via-clinic-500 to-clinic-400 px-6 pt-8 pb-10 sm:py-10 flex items-center justify-center">
                  <div
                    className="absolute inset-0 opacity-[0.1] pointer-events-none"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 25% 75%, white 1px, transparent 1px), radial-gradient(circle at 75% 25%, white 1px, transparent 1px)",
                      backgroundSize: "28px 28px",
                    }}
                    aria-hidden
                  />
                  {fullLogoUrl ? (
                    <img
                      src={fullLogoUrl}
                      alt={`Logotipi i ${displayName}`}
                      className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white/90 shadow-card-md"
                    />
                  ) : (
                    <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/95 flex items-center justify-center ring-4 ring-white/90 shadow-card-md">
                      <span className="text-3xl font-bold text-clinic-600">
                        {getInitials(displayName)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 px-5 sm:px-8 py-6 sm:py-8 flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-slate-100">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      {displayName}
                    </h2>
                    <span className="badge bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80">
                      Aktive
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Klinikë e regjistruar në iKlinika
                  </p>
                </div>
              </div>
            </div>

            {/* Contact details */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3 px-0.5">
                Kontakti & vendndodhja
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <InfoField icon={FiMapPin} label="Adresa" value={displayAddress} />
                <InfoField icon={FiPhone} label="Telefoni" value={displayPhone} />
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3 px-0.5">
                Përshkrimi
              </h3>
              <div className="card-padded">
                {displayDescription ? (
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                    {displayDescription}
                  </p>
                ) : (
                  <p className="text-slate-400 italic text-sm flex items-center gap-2">
                    <FiFileText size={16} aria-hidden />
                    Nuk ka përshkrim të shtuar ende.
                  </p>
                )}
              </div>
            </div>

            {/* Branding note */}
            <div className="rounded-xl border border-clinic-200/80 bg-clinic-50/60 px-4 py-3.5 sm:px-5 flex gap-3">
              <span className="inline-flex p-2 rounded-lg bg-white text-clinic-600 shrink-0 h-fit border border-clinic-200/60">
                <FiImage size={16} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-clinic-800">Identiteti vizual</p>
                <p className="text-xs sm:text-sm text-clinic-700/80 mt-0.5 leading-relaxed">
                  Emri dhe logotipi shfaqen në panel, raportet PDF dhe dokumentet e klinikës.
                  Përditësoni profilin për të mbajtur branding-un konsistent.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
