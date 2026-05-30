import React, { useState } from "react";
import { applyForClinic } from "../../api/auth";
import Notification from "../ui/Notification";
import { Link } from "react-router-dom";
import {
  CLINIC_MODE_SOLO_DOCTOR,
  CLINIC_MODE_FULL_TEAM,
} from "../../utils/clinicMode";

const inputClass =
  "w-full px-4 py-3 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-clinic-400/30 focus:border-clinic-400 transition-all";

/**
 * @param {{ embedded?: boolean }} props
 * When embedded=true, only the form is rendered (page shell provides title/copy).
 */
const ClinicApply = ({ embedded = false }) => {
  const [clinicName, setClinicName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clinicMode, setClinicMode] = useState(CLINIC_MODE_FULL_TEAM);
  const [loading, setLoading] = useState(false);

  const [notif, setNotif] = useState({
    visible: false,
    type: "info",
    message: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await applyForClinic(clinicName, email, password, clinicMode);

      setNotif({
        visible: true,
        type: "success",
        message:
          "Application submitted successfully. You will be contacted after review.",
      });

      setClinicName("");
      setEmail("");
      setPassword("");
      setClinicMode(CLINIC_MODE_FULL_TEAM);
    } catch (err) {
      const msg =
        err.response?.data?.message ??
        (typeof err.response?.data === "string" ? err.response.data : null) ??
        err.message ??
        "Failed to submit application. Please try again.";
      setNotif({
        visible: true,
        type: "error",
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((prev) => ({ ...prev, visible: false }))}
      />

      {!embedded && (
        <>
          <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight mb-4">
            Aplikoni për iKlinika
          </h1>
          <p className="text-slate-600 mb-10 max-w-xl leading-relaxed">
            Plotësoni aplikimin për klinikën tuaj. Ekipi ynë e shqyrton dhe aktivizon llogarinë pasi të aprovohet.
          </p>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="clinic-name" className="label">
            Emri i klinikës
          </label>
          <input
            id="clinic-name"
            type="text"
            placeholder="Clinic name"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="admin-email" className="label">
            Email i administratorit
          </label>
          <input
            id="admin-email"
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="admin-password" className="label">
            Fjalëkalimi
          </label>
          <input
            id="admin-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="clinic-mode" className="label">
            Lloji i klinikës *
          </label>
          <select
            id="clinic-mode"
            value={clinicMode}
            onChange={(e) => setClinicMode(e.target.value)}
            required
            className={inputClass}
          >
            <option value={CLINIC_MODE_FULL_TEAM}>
              FullTeam - me infermier dhe laborator
            </option>
            <option value={CLINIC_MODE_SOLO_DOCTOR}>
              SoloDoctor - vetëm mjek (pa infermier, pa laborator)
            </option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>

        <p className="text-center text-slate-500 text-sm pt-1">
          Tashmë i aprovuar?{" "}
          <Link to="/login" className="font-semibold text-clinic-600 hover:text-clinic-700 transition-colors">
            Hyr në sistem
          </Link>
        </p>
      </form>

      {!embedded && (
        <p className="text-xs text-slate-400 mt-8 uppercase tracking-wider">
          I sigurt • I shqyrtuar • iKlinika
        </p>
      )}
    </>
  );
};

export default ClinicApply;
