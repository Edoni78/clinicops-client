import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMapPin,
  FiPhone,
  FiEdit2,
  FiCheck,
  FiX,
  FiBriefcase,
} from "react-icons/fi";
import Notification from "../../../components/ui/Notification";
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
  const [logoFile, setLogoFile] = useState(null);
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

  return (
    <>
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((p) => ({ ...p, visible: false }))}
      />

      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <FiBriefcase className="text-[#81a2c5]" size={32} />
            Profili i klinikës
          </h1>
          <p className="text-slate-600 mt-1">
            Karta e klinikës: emri, logotipi, adresa, telefoni dhe përshkrimi.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <svg
              className="animate-spin h-10 w-10 text-[#81a2c5]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : !profile ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            Nuk mund të ngarkohet profili i klinikës.
          </div>
        ) : editing ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Ndrysho karten e klinikës</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Emri *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                  maxLength={200}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
                  placeholder="Emri i klinikës"
                />
              </div>
              <div>
                  placeholder="Adresa / vendndodhja"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefoni</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  maxLength={50}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
                  placeholder="Numri i telefonit"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Përshkrimi</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={4}
                  maxLength={2000}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent resize-none"
                  placeholder="Rreth klinikës suaj..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Logotipi</label>
                <input
                  type="file"
                  accept={ALLOWED_LOGO_TYPES}
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#81a2c5] file:text-white file:font-medium hover:file:bg-[#6b8fa8]"
                />
                <p className="text-xs text-slate-500 mt-1">Të lejuara: JPG, PNG, GIF, WebP</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#81a2c5] text-white font-medium rounded-lg hover:bg-[#6b8fa8] disabled:opacity-50"
                >
                  <FiCheck size={18} />
                  {submitting ? "Duke ruajtur…" : "Ruaj"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 disabled:opacity-50"
                >
                  <FiX size={18} />
                  Anulo
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 flex flex-col sm:flex-row gap-6">
              <div className="flex-shrink-0">
                {fullLogoUrl ? (
                  <img
                    src={fullLogoUrl}
                    alt="Clinic logo"
                    className="w-24 h-24 rounded-xl object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-[#81a2c5]/10 flex items-center justify-center border border-slate-200">
                    <span className="text-2xl font-bold text-[#81a2c5]">
                      {getInitials(displayName)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-slate-900">{displayName}</h2>
                <div className="mt-3 space-y-2 text-slate-600">
                  <p className="flex items-center gap-2">
                    <FiMapPin size={16} className="flex-shrink-0 text-slate-400" />
                    <span>{displayAddress}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <FiPhone size={16} className="flex-shrink-0 text-slate-400" />
                    <span>{displayPhone}</span>
                  </p>
                </div>
                {displayDescription && (
                  <p className="mt-3 text-sm text-slate-600 whitespace-pre-wrap">{displayDescription}</p>
                )}
              </div>
            </div>
            <div className="px-6 pb-6">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#81a2c5] text-white text-sm font-medium rounded-lg hover:bg-[#6b8fa8]"
              >
                <FiEdit2 size={18} />
                Ndrysho profilin
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
