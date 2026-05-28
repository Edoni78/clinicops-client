import React, { useState } from "react";
import { login as apiLogin } from "../../api/auth";
import Notification from "../../components/ui/Notification";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiMail, FiLock } from "react-icons/fi";

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
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-clinic-500 mb-8 transition-colors"
      >
        ← Faqe kryesore
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-clinic-400 text-white font-bold shadow-sm">
            iK
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Hyr në iKlinika</h1>
            <p className="text-sm text-slate-500 mt-0.5">Paneli i menaxhimit të klinikës</p>
          </div>
        </div>
        <p className="text-slate-600 max-w-md text-sm sm:text-base">
          Identifikohuni për të menaxhuar klinikën, pacientët dhe stafin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
        <div>
          <label htmlFor="login-email" className="label">
            Email
          </label>
          <div className="input-icon-wrap">
            <FiMail className="input-icon" size={18} />
            <input
              id="login-email"
              type="email"
              placeholder="admin@klinika.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="input-with-icon"
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className="label">
            Fjalëkalimi
          </label>
          <div className="input-icon-wrap">
            <FiLock className="input-icon" size={18} />
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="input-with-icon"
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
          {loading ? "Duke u identifikuar…" : "Hyr"}
        </button>

        <p className="text-center text-slate-500 text-sm pt-2">
          Nuk keni llogari klinike?{" "}
          <Link to="/apply" className="font-semibold text-clinic-500 hover:text-clinic-600 hover:underline">
            Aplikoni këtu
          </Link>
        </p>
      </form>

      <p className="text-xs text-slate-400 mt-10">I sigurt • I shpejtë • iKlinika</p>
    </>
  );
};

export default ClinicLoginForm;
