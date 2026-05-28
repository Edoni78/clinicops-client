import React, { useState } from "react";
import {
  login as apiLogin,
  setupMfa,
  enableMfa,
  verifyMfaLogin,
} from "../../api/auth";
import Notification from "../../components/ui/Notification";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiMail, FiLock } from "react-icons/fi";
import QRCode from "qrcode";

const ClinicLoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaStep, setMfaStep] = useState("idle");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaTicket, setMfaTicket] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [qrCodeUri, setQrCodeUri] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [enablingMfa, setEnablingMfa] = useState(false);
  const [verifyingMfaLogin, setVerifyingMfaLogin] = useState(false);
  const [mfaSetupError, setMfaSetupError] = useState("");

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
      const requiresMfa =
        res?.requiresMfa === true || res?.RequiresMfa === true;
      const incomingMfaTicket = res?.mfaTicket ?? res?.MfaTicket ?? "";

      // MFA-enabled account: backend returns challenge ticket instead of JWT.
      if (requiresMfa && incomingMfaTicket) {
        setMfaTicket(incomingMfaTicket);
        setMfaCode("");
        setMfaStep("verifyLogin");
        setNotif({
          visible: true,
          type: "info",
          message: "Enter your Google Authenticator code to continue.",
        });
        return;
      }

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

      // Exact requested flow: login first, then setup MFA via authenticated endpoint.
      try {
        const mfaRes = await setupMfa();
        const setupUri =
          mfaRes?.qrCodeUri ??
          mfaRes?.QrCodeUri ??
          mfaRes?.otpauthUri ??
          mfaRes?.otpAuthUri ??
          mfaRes?.otpauth_url ??
          "";
        if (!setupUri) {
          setMfaSetupError(
            "MFA setup response did not include qrCodeUri. Please check backend response shape."
          );
          setMfaStep("setup");
          return;
        }

        const dataUrl = await QRCode.toDataURL(setupUri, { margin: 1, width: 220 });
        setQrCodeUri(setupUri);
        setQrImageUrl(dataUrl);
        setMfaSetupError("");
        setMfaStep("setup");
      } catch (mfaErr) {
        const message =
          mfaErr?.response?.data?.message ??
          mfaErr?.response?.data ??
          mfaErr?.message ??
          "MFA setup failed.";
        setMfaSetupError(String(message));
        setMfaStep("setup");
      }
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

  const completeAuthAndNavigate = (authRes) => {
    const token = authRes?.accessToken ?? authRes?.access_token;
    const user = authRes?.user ?? authRes?.User;
    if (!token || !user) {
      throw new Error("Invalid login response");
    }

    localStorage.setItem("accessToken", token);
    if (authRes?.expiresAtUtc) {
      localStorage.setItem("token_expires", authRes.expiresAtUtc);
    }
    login(user);
    navigate("/dashboard");
  };

  const handleVerifyMfaLogin = async () => {
    const code = mfaCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setNotif({
        visible: true,
        type: "warning",
        message: "Please enter a valid 6-digit authenticator code.",
      });
      return;
    }
    if (!mfaTicket) {
      setNotif({
        visible: true,
        type: "error",
        message: "MFA ticket missing. Please login again.",
      });
      setMfaStep("idle");
      return;
    }

    setVerifyingMfaLogin(true);
    try {
      const authRes = await verifyMfaLogin(mfaTicket, code);
      completeAuthAndNavigate(authRes);
    } catch (err) {
      setNotif({
        visible: true,
        type: "error",
        message:
          err?.response?.data?.message ??
          err?.response?.data ??
          "Invalid authenticator code.",
      });
    } finally {
      setVerifyingMfaLogin(false);
    }
  };

  const handleEnableMfa = async () => {
    const code = mfaCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setNotif({
        visible: true,
        type: "warning",
        message: "Please enter a valid 6-digit authenticator code.",
      });
      return;
    }

    setEnablingMfa(true);
    try {
      const res = await enableMfa(code);
      const codes = res?.recoveryCodes ?? res?.RecoveryCodes ?? [];
      setRecoveryCodes(Array.isArray(codes) ? codes : []);
      setMfaStep("enabled");
      setNotif({
        visible: true,
        type: "success",
        message: "MFA enabled successfully.",
      });
    } catch (err) {
      setNotif({
        visible: true,
        type: "error",
        message:
          err?.response?.data?.message ??
          err?.response?.data ??
          "Could not enable MFA. Please verify the code and try again.",
      });
    } finally {
      setEnablingMfa(false);
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

      {mfaStep !== "idle" ? (
        <div className="space-y-5 max-w-md">
          {mfaStep === "verifyLogin" && (
            <>
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                <h2 className="text-lg font-semibold text-slate-900">MFA required</h2>
                <p className="mt-2 text-sm text-slate-700">
                  Open Google Authenticator and enter your current 6-digit code.
                </p>
              </div>

              <div>
                <label htmlFor="mfa-login-code" className="label">
                  6-digit code
                </label>
                <input
                  id="mfa-login-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  className="input"
                  placeholder="123456"
                />
              </div>

              <button
                type="button"
                className="btn-primary btn-lg w-full"
                onClick={handleVerifyMfaLogin}
                disabled={verifyingMfaLogin}
              >
                {verifyingMfaLogin ? "Verifying..." : "Verify and login"}
              </button>

              <button
                type="button"
                className="btn-secondary btn-md w-full"
                onClick={() => {
                  setMfaStep("idle");
                  setMfaTicket("");
                  setMfaCode("");
                }}
              >
                Back to login
              </button>
            </>
          )}

          {mfaStep === "setup" && (
            <>
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                <h2 className="text-lg font-semibold text-slate-900">Set up Google Authenticator</h2>
                <ol className="mt-2 text-sm text-slate-700 space-y-1 list-decimal list-inside">
                  <li>Open Google Authenticator on your phone.</li>
                  <li>Tap + then "Scan a QR code".</li>
                  <li>Scan this QR and enter the current 6-digit code below.</li>
                </ol>
              </div>

              {mfaSetupError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                  <p className="text-sm text-red-700">{mfaSetupError}</p>
                </div>
              ) : null}

              <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                {qrImageUrl ? (
                  <img src={qrImageUrl} alt="MFA QR code" className="mx-auto rounded-lg border border-slate-200" />
                ) : (
                  <p className="text-sm text-slate-500">QR code not available yet.</p>
                )}
                <p className="text-xs text-slate-400 mt-3 break-all">
                  If scanning fails, manual key URI: {qrCodeUri || "N/A"}
                </p>
              </div>

              <div>
                <label htmlFor="mfa-code" className="label">
                  6-digit code
                </label>
                <input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  className="input"
                  placeholder="123456"
                />
              </div>

              <button
                type="button"
                onClick={handleEnableMfa}
                disabled={enablingMfa || !qrCodeUri}
                className="btn-primary btn-lg w-full"
              >
                {enablingMfa ? "Enabling MFA..." : "Enable MFA"}
              </button>

              <button
                type="button"
                className="btn-secondary btn-md w-full"
                onClick={() => navigate("/dashboard")}
              >
                Skip for now
              </button>
            </>
          )}

          {mfaStep === "enabled" && (
            <>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <h2 className="text-lg font-semibold text-emerald-900">MFA enabled</h2>
                <p className="text-sm text-emerald-800 mt-1">
                  Save your recovery codes in a safe place.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                <p className="text-sm font-medium text-slate-800 mb-2">Recovery codes</p>
                {recoveryCodes.length > 0 ? (
                  <ul className="space-y-1">
                    {recoveryCodes.map((code, idx) => (
                      <li key={`${code}-${idx}`} className="font-mono text-sm text-slate-700">
                        {code}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No recovery codes returned.</p>
                )}
              </div>

              <button
                type="button"
                className="btn-primary btn-lg w-full"
                onClick={() => navigate("/dashboard")}
              >
                Continue to dashboard
              </button>
            </>
          )}
        </div>
      ) : (
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
      )}

      <p className="text-xs text-slate-400 mt-10">I sigurt • I shpejtë • iKlinika</p>
    </>
  );
};

export default ClinicLoginForm;
