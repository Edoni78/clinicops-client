import React, { useState } from "react";
import { login as apiLogin } from "../../api/auth";
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
      const res = await apiLogin(email, password);
      const token = res.accessToken ?? res.access_token;
      const user = res.user ?? res.User;

      if (!token || !user) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("accessToken", token);
      if (res.expiresAtUtc) {
        localStorage.setItem("token_expires", res.expiresAtUtc);
      }

      login(user);

      setNotif({
        visible: true,
        type: "success",
        message: "Login successful",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (err) {
      setNotif({
        visible: true,
        type: "error",
        message:
          err.response?.data?.message ??
          err.response?.data ??
          err.message ??
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

      <Link
        to="/"
        className="inline-block text-sm font-semibold text-slate-500 hover:text-[#81a2c5] mb-6"
      >
        ← Faqe kryesore
      </Link>

      <h1 className="text-4xl font-bold text-[#81a2c5] mb-4">
        Hyr në iKlinika
      </h1>

      <p className="text-slate-500 mb-10 max-w-xl">
        Identifikohuni për të menaxhuar klinikën, pacientët dhe stafin.
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
          Nuk keni llogari klinike?{" "}
          <Link
            to="/apply"
            className="font-semibold text-[#81a2c5] hover:underline"
          >
            Aplikoni këtu
          </Link>
        </p>
      </form>

      <p className="text-sm text-slate-400 mt-10">
        I sigurt • I shpejtë • iKlinika
      </p>
    </>
  );
};

export default ClinicLoginForm;
