import React, { useState } from "react";
import { applyForClinic } from "../../api/auth";
import Notification from "../ui/Notification";
import { Link } from "react-router-dom";
import {
  CLINIC_MODE_SOLO_DOCTOR,
  CLINIC_MODE_FULL_TEAM,
} from "../../utils/clinicMode";

const ClinicApply = () => {
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
        onClose={() =>
          setNotif((prev) => ({ ...prev, visible: false }))
        }
      />

      <h1 className="text-4xl font-bold text-clinic-400 mb-4">
        Aplikoni për iKlinika
      </h1>

      <p className="text-slate-500 mb-10 max-w-xl">
        Plotësoni aplikimin për klinikën tuaj. Ekipi ynë e shqyrton dhe aktivizon llogarinë pasi të
        aprovohet.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 max-w-xl"
      >
        <input
          type="text"
          placeholder="Clinic name"
          value={clinicName}
          onChange={(e) => setClinicName(e.target.value)}
          required
          className="w-full border border-slate-300 rounded-md px-4 py-3 text-lg
          focus:outline-none focus:ring-2 focus:ring-clinic-400"
        />

        <input
          type="email"
          placeholder="Admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-slate-300 rounded-md px-4 py-3 text-lg
          focus:outline-none focus:ring-2 focus:ring-clinic-400"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border border-slate-300 rounded-md px-4 py-3 text-lg
          focus:outline-none focus:ring-2 focus:ring-clinic-400"
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Lloji i klinikës *
          </label>
          <select
            value={clinicMode}
            onChange={(e) => setClinicMode(e.target.value)}
            required
            className="w-full border border-slate-300 rounded-md px-4 py-3 text-base bg-white
            focus:outline-none focus:ring-2 focus:ring-clinic-400"
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
          className="w-full bg-clinic-400 text-white py-3 rounded-md text-lg font-semibold
          hover:opacity-90 transition disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>

        <p className="text-center text-slate-500 text-sm">
          Tashmë i aprovuar?{" "}
          <Link
            to="/login"
            className="font-semibold text-clinic-400 hover:underline"
          >
            Hyr në sistem
          </Link>
        </p>
      </form>

      <p className="text-sm text-slate-400 mt-10">
        I sigurt • I shqyrtuar • iKlinika
      </p>
    </>
  );
};

export default ClinicApply;
