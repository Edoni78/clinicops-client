import React, { useState } from "react";
import axios from "axios";
import Notification from "../ui/Notification";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:5258";

const ClinicApply = () => {
  const [clinicName, setClinicName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      await axios.post(`${API_BASE}/api/Auth/apply`, {
        clinicName,
        email,
        password,
      });

      setNotif({
        visible: true,
        type: "success",
        message:
          "Application submitted successfully. You will be contacted after review.",
      });

      // clear form
      setClinicName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setNotif({
        visible: true,
        type: "error",
        message:
          err.response?.data ||
          "Failed to submit application. Please try again.",
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

      <h1 className="text-4xl font-bold text-[#81a2c5] mb-4">
        Apply for ClinicOps
      </h1>

      <p className="text-slate-500 mb-10 max-w-xl">
        Submit your clinic application. Our team will review it and
        activate your account once approved.
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
          focus:outline-none focus:ring-2 focus:ring-[#81a2c5]"
        />

        <input
          type="email"
          placeholder="Admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-slate-300 rounded-md px-4 py-3 text-lg
          focus:outline-none focus:ring-2 focus:ring-[#81a2c5]"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border border-slate-300 rounded-md px-4 py-3 text-lg
          focus:outline-none focus:ring-2 focus:ring-[#81a2c5]"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#81a2c5] text-white py-3 rounded-md text-lg font-semibold
          hover:opacity-90 transition disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>

        <p className="text-center text-slate-500 text-sm">
          Already approved?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#81a2c5] hover:underline"
          >
            Log in
          </Link>
        </p>
      </form>

      <p className="text-sm text-slate-400 mt-10">
        Secure • Reviewed • ClinicOps
      </p>
    </>
  );
};

export default ClinicApply;
