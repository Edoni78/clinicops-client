import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiEdit2, FiCheck, FiX, FiImage } from "react-icons/fi";
import Notification from "../../../components/ui/Notification";
import PageHeader from "../../../components/ui/PageHeader";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import {
  getDoctorProfile,
  updateDoctorProfile,
  uploadDoctorSignature,
  uploadDoctorStamp,
  getDoctorImageFullUrl,
} from "../../../api/doctorProfile";
import { useAuth } from "../../../context/AuthContext";

const ALLOWED_IMAGE_TYPES = "image/jpeg,image/png,image/gif,image/webp";

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
  const sigUrl = profile?.signatureUrl ?? profile?.SignatureUrl;
  const stampUrl = profile?.stampUrl ?? profile?.StampUrl;
  const fullSigUrl = getDoctorImageFullUrl(sigUrl);
  const fullStampUrl = getDoctorImageFullUrl(stampUrl);

  return (
    <>
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((p) => ({ ...p, visible: false }))}
      />

      <div className="page-shell max-w-3xl">
        <PageHeader
          title="Profili i mjekut"
          subtitle="Emri i shfaqur, nënshkrimi dhe vula. Përdoren në raportet mjekësore."
          icon={FiUser}
        />

        {loading ? (
          <LoadingSpinner className="py-16" label="Duke ngarkuar profilin…" />
        ) : !profile ? (
          <div className="card-padded text-center text-slate-500">
            Nuk mund të ngarkohet profili.
          </div>
        ) : editing ? (
          <div className="card-padded">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Ndrysho profilin</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Emri i shfaqur</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={200}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-clinic-400 focus:border-transparent"
                  placeholder="p.sh. Dr. Emri Mbiemri"
                />
                <p className="text-xs text-slate-500 mt-1">Maksimum 200 karaktere. Shfaqet në raporte dhe në header.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nënshkrimi (imazh)</label>
                <input
                  type="file"
                  accept={ALLOWED_IMAGE_TYPES}
                  onChange={(e) => setSignatureFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-clinic-400 file:text-white file:font-medium hover:file:bg-clinic-500"
                />
                <p className="text-xs text-slate-500 mt-1">JPG, PNG, GIF, WebP. Zëvendëson nënshkrimin aktual.</p>
                {signatureFile && <p className="text-xs text-emerald-600 mt-1">Skedar i zgjedhur: {signatureFile.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vula (imazh)</label>
                <input
                  type="file"
                  accept={ALLOWED_IMAGE_TYPES}
                  onChange={(e) => setStampFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-clinic-400 file:text-white file:font-medium hover:file:bg-clinic-500"
                />
                <p className="text-xs text-slate-500 mt-1">JPG, PNG, GIF, WebP. Zëvendëson vulën aktuale.</p>
                {stampFile && <p className="text-xs text-emerald-600 mt-1">Skedar i zgjedhur: {stampFile.name}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-clinic-400 text-white font-medium rounded-lg hover:bg-clinic-500 disabled:opacity-50"
                >
                  <FiCheck size={18} />
                  {submitting ? "Duke ruajtur…" : "Ruaj"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200"
                >
                  <FiX size={18} />
                  Anulo
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-start">
              <h2 className="text-lg font-semibold text-slate-900">Të dhënat e profilit</h2>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-clinic-400 text-white text-sm font-medium rounded-lg hover:bg-clinic-500"
              >
                <FiEdit2 size={16} />
                Ndrysho
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">Emri i shfaqur</p>
                <p className="font-medium text-slate-900">
                  {(profile?.displayName ?? profile?.DisplayName) || "Nuk është vendosur"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Email</p>
                <p className="font-medium text-slate-900">{email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-2">Nënshkrimi</p>
                {fullSigUrl ? (
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 inline-block">
                    <img
                      src={fullSigUrl}
                      alt="Nënshkrimi"
                      className="max-h-24 object-contain"
                    />
                  </div>
                ) : (
                  <p className="text-slate-500 italic flex items-center gap-2">
                    <FiImage size={18} />
                    Nuk ka nënshkrim të ngarkuar
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-2">Vula</p>
                {fullStampUrl ? (
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 inline-block">
                    <img
                      src={fullStampUrl}
                      alt="Vula"
                      className="max-h-24 object-contain"
                    />
                  </div>
                ) : (
                  <p className="text-slate-500 italic flex items-center gap-2">
                    <FiImage size={18} />
                    Nuk ka vulë të ngarkuar
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
