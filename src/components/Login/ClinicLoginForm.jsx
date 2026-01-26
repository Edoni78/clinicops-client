import React, { useState } from "react";
import api from "../../api/axios";
import Notification from "../../components/ui/Notification";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ClinicLoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

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
      const res = await api.post("/api/Auth/login", {
        email,
        password,
      });

      // store token
      localStorage.setItem("accessToken", res.data.accessToken);

      // ✅ IMPORTANT: hydrate auth context
      login(res.data.user);

      setNotif({
        visible: true,
        type: "success",
        message: "Login successful",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } catch (err) {
      setNotif({
        visible: true,
        type: "error",
        message:
          err.response?.data ||
          "Invalid email or password.",
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
        Clinic Login
      </h1>

      <p className="text-slate-500 mb-10 max-w-xl">
        Sign in to manage your clinic operations.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 max-w-xl"
      >
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
          {loading ? "Signing in..." : "Login"}
        </button>

        <p className="text-center text-slate-500 text-sm">
          Don’t have a clinic account?{" "}
          <Link
            to="/"
            className="font-semibold text-[#81a2c5] hover:underline"
          >
            Create one
          </Link>
        </p>
      </form>

      <p className="text-sm text-slate-400 mt-10">
        Secure • Fast • ClinicOps
      </p>
    </>
  );
};

export default ClinicLoginForm;
