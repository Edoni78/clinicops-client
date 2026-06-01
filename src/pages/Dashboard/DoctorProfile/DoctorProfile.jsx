import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiEdit2,
  FiCheck,
  FiX,
  FiImage,
  FiUpload,
  FiMail,
  FiFileText,
} from "react-icons/fi";
import Notification from "../../../components/ui/Notification";
import PageHeader from "../../../components/ui/PageHeader";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import EmptyState from "../../../components/ui/EmptyState";
import {
  getDoctorProfile,
  updateDoctorProfile,
  uploadDoctorSignature,
  uploadDoctorStamp,
  getDoctorImageFullUrl,
} from "../../../api/doctorProfile";
import { useAuth } from "../../../context/AuthContext";

const ALLOWED_IMAGE_TYPES = "image/jpeg,image/png,image/gif,image/webp";

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
          <p
            className={`text-sm sm:text-base leading-relaxed ${
              hasValue ? "text-slate-900 font-medium" : "text-slate-400 italic"
            }`}
          >
            {hasValue ? value : emptyText}
          </p>
        </div>
      </div>
    </div>
  );
}

function ImageAssetCard({ label, imageUrl, emptyText }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/60">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      </div>
      <div className="p-4 sm:p-5 flex items-center justify-center min-h-[7rem] bg-white">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={label}
            className="max-h-28 max-w-full object-contain rounded-lg"
          />
        ) : (
          <p className="text-sm text-slate-400 italic flex items-center gap-2">
            <FiImage size={16} aria-hidden />
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DoctorProfile() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const isDoctor = role && String(role).toLowerCase() === "doctor";

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [notif, setNotif] = useState({ visible: false, type: "info", message: "" });

  const [displayName, setDisplayName] = useState("");
  const [signatureFile, setSignatureFile] = useState(null);
  const [stampFile, setStampFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [stampPreview, setStampPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!isDoctor) return;
    setLoading(true);
    try {
      const data = await getDoctorProfile();
      setProfile(data);
      setDisplayName(data?.displayName ?? data?.DisplayName ?? "");
    } catch (err) {
      const status = err.response?.status;
      const msg =
        status === 403
          ? "Vetëm mjekët mund të shohin këtë faqe."
          : status === 401
            ? "Duhet të jeni të kyçur."
            : err.response?.data?.message ?? err.response?.data ?? "Dështoi ngarkimi i profilit.";
      setNotif({ visible: true, type: "error", message: msg });
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [isDoctor]);

  useEffect(() => {
    if (!isDoctor) {
      navigate("/dashboard", { replace: true });
      return;
    }
    fetchProfile();
  }, [isDoctor, fetchProfile, navigate]);

  useEffect(() => {
    if (!signatureFile) {
      setSignaturePreview(null);
      return;
    }
    const url = URL.createObjectURL(signatureFile);
    setSignaturePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [signatureFile]);

  useEffect(() => {
    if (!stampFile) {
      setStampPreview(null);
      return;
    }
    const url = URL.createObjectURL(stampFile);
    setStampPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [stampFile]);

  const showNotif = (type, message) => {
    setNotif({ visible: true, type, message });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (displayName.trim().length > 200) {
        showNotif("error", "Emri nuk duhet të kalojë 200 karaktere.");
        setSubmitting(false);
        return;
      }
      if (displayName.trim() !== (profile?.displayName ?? profile?.DisplayName ?? "")) {
        const updated = await updateDoctorProfile({ displayName: displayName.trim() });
        setProfile(updated);
      }
      if (signatureFile) {
        const updated = await uploadDoctorSignature(signatureFile);
        setProfile(updated);
        setSignatureFile(null);
      }
      if (stampFile) {
        const updated = await uploadDoctorStamp(stampFile);
        setProfile(updated);
        setStampFile(null);
      }
      showNotif("success", "Profili u ruajt.");
      setEditing(false);
      fetchProfile();
    } catch (err) {
      const status = err.response?.status;
      const msg =
        status === 400
          ? "Skedari nuk është i vlefshëm ose formati nuk lejohet (JPG, PNG, GIF, WebP)."
          : status === 403
            ? "Nuk keni të drejtë për të përditësuar këtë profil."
            : err.response?.data?.message ?? err.response?.data ?? "Dështoi ruajtja.";
      showNotif("error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setSignatureFile(null);
    setStampFile(null);
    setDisplayName(profile?.displayName ?? profile?.DisplayName ?? "");
  };

  if (!isDoctor) return null;

  const email = profile?.email ?? profile?.Email ?? "—";
  const profileDisplayName = profile?.displayName ?? profile?.DisplayName ?? "";
  const sigUrl = profile?.signatureUrl ?? profile?.SignatureUrl;
  const stampUrl = profile?.stampUrl ?? profile?.StampUrl;
  const fullSigUrl = getDoctorImageFullUrl(sigUrl);
  const fullStampUrl = getDoctorImageFullUrl(stampUrl);
  const heroName = profileDisplayName || email || "Mjek";

  const editAction = (
    <button type="button" onClick={() => setEditing(true)} className="btn-primary btn-md">
      <FiEdit2 size={16} aria-hidden />
      Ndrysho profilin
    </button>
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
          title="Profili i mjekut"
          subtitle="Emri i shfaqur, nënshkrimi dhe vula — përdoren në raportet mjekësore dhe dokumentet PDF."
          icon={FiUser}
          actions={!loading && profile && !editing ? editAction : undefined}
        />

        {loading ? (
          <LoadingSpinner className="py-16" label="Duke ngarkuar profilin…" />
        ) : !profile ? (
          <div className="card">
            <EmptyState
              icon={FiUser}
              title="Profili nuk u ngarkua"
              description="Nuk mund të ngarkohet profili i mjekut. Provoni të rifreskoni faqen."
            />
          </div>
        ) : editing ? (
          <div className="card-padded">
            <div className="mb-6 pb-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Ndrysho profilin e mjekut</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Përditësoni emrin e shfaqur dhe dokumentet që shfaqen në raportet.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
              <section>
                <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="inline-flex p-1.5 rounded-lg bg-clinic-100 text-clinic-600">
                    <FiUser size={14} aria-hidden />
                  </span>
                  Informacioni bazë
                </h3>
                <label htmlFor="doctor-display-name" className="label">
                  Emri i shfaqur
                </label>
                <input
                  id="doctor-display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={200}
                  className="input"
                  placeholder="p.sh. Dr. Ana Krasniqi"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  {displayName.length}/200 karaktere · shfaqet në raporte dhe panel
                </p>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="inline-flex p-1.5 rounded-lg bg-clinic-100 text-clinic-600">
                    <FiFileText size={14} aria-hidden />
                  </span>
                  Nënshkrimi
                </h3>
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="shrink-0 w-full sm:w-40">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex items-center justify-center min-h-[6rem]">
                      {(signaturePreview || fullSigUrl) ? (
                        <img
                          src={signaturePreview || fullSigUrl}
                          alt="Parapamje e nënshkrimit"
                          className="max-h-20 max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-slate-400 italic">Asnjë imazh</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor="doctor-signature"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:border-clinic-300 cursor-pointer transition-colors"
                    >
                      <FiUpload size={16} aria-hidden />
                      Zgjidhni nënshkrim
                    </label>
                    <input
                      id="doctor-signature"
                      type="file"
                      accept={ALLOWED_IMAGE_TYPES}
                      onChange={(e) => setSignatureFile(e.target.files?.[0] ?? null)}
                      className="sr-only"
                    />
                    <p className="text-xs text-slate-500 mt-2">JPG, PNG, GIF ose WebP. PNG me sfond transparent rekomandohet.</p>
                    {signatureFile && (
                      <p className="text-xs text-emerald-600 mt-1.5 font-medium">
                        Skedar i zgjedhur: {signatureFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="inline-flex p-1.5 rounded-lg bg-clinic-100 text-clinic-600">
                    <FiImage size={14} aria-hidden />
                  </span>
                  Vula
                </h3>
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="shrink-0 w-full sm:w-40">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex items-center justify-center min-h-[6rem]">
                      {(stampPreview || fullStampUrl) ? (
                        <img
                          src={stampPreview || fullStampUrl}
                          alt="Parapamje e vulës"
                          className="max-h-20 max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-slate-400 italic">Asnjë imazh</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor="doctor-stamp"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:border-clinic-300 cursor-pointer transition-colors"
                    >
                      <FiUpload size={16} aria-hidden />
                      Zgjidhni vulë
                    </label>
                    <input
                      id="doctor-stamp"
                      type="file"
                      accept={ALLOWED_IMAGE_TYPES}
                      onChange={(e) => setStampFile(e.target.files?.[0] ?? null)}
                      className="sr-only"
                    />
                    <p className="text-xs text-slate-500 mt-2">JPG, PNG, GIF ose WebP. Imazh i qartë i vulës së klinikës.</p>
                    {stampFile && (
                      <p className="text-xs text-emerald-600 mt-1.5 font-medium">
                        Skedar i zgjedhur: {stampFile.name}
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
        ) : (
          <div className="space-y-6">
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
                  <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/95 flex items-center justify-center ring-4 ring-white/90 shadow-card-md">
                    <span className="text-3xl font-bold text-clinic-600">
                      {getInitials(heroName)}
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-w-0 px-5 sm:px-8 py-6 sm:py-8 flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-slate-100">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      {profileDisplayName || "Emri nuk është vendosur"}
                    </h2>
                    <span className="badge bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80">
                      Mjek
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{email}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="section-title">Të dhënat e profilit</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <InfoField
                  icon={FiUser}
                  label="Emri i shfaqur"
                  value={profileDisplayName}
                  emptyText="Nuk është vendosur ende"
                />
                <InfoField icon={FiMail} label="Email" value={email} />
              </div>
            </div>

            <div>
              <h3 className="section-title">Dokumentet e raportit</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <ImageAssetCard
                  label="Nënshkrimi"
                  imageUrl={fullSigUrl}
                  emptyText="Nuk ka nënshkrim të ngarkuar"
                />
                <ImageAssetCard
                  label="Vula"
                  imageUrl={fullStampUrl}
                  emptyText="Nuk ka vulë të ngarkuar"
                />
              </div>
            </div>

            <div className="rounded-xl border border-clinic-200/80 bg-clinic-50/60 px-4 py-3.5 sm:px-5 flex gap-3">
              <span className="inline-flex p-2 rounded-lg bg-white text-clinic-600 shrink-0 h-fit border border-clinic-200/60">
                <FiFileText size={16} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-clinic-800">Përdorimi në raporte</p>
                <p className="text-xs sm:text-sm text-clinic-700/80 mt-0.5 leading-relaxed">
                  Emri, nënshkrimi dhe vula shfaqen automatikisht në raportet PDF të vizitave.
                  Sigurohuni që imazhet të jenë të qarta dhe të lexueshme.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
