import React from "react";
import { getJwtPayload } from "../../utils/jwt";

const Topbar = () => {
  const payload = getJwtPayload();
  const clinicName = payload?.clinicName;

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      <span className="text-slate-600">
        Welcome 👋{" "}
        {clinicName && (
          <span className="font-semibold text-slate-800">
            {clinicName}
          </span>
        )}
      </span>

      <button
        onClick={() => {
          localStorage.removeItem("accessToken");
          window.location.href = "/login";
        }}
        className="text-sm text-red-500"
      >
        Logout
      </button>
    </header>
  );
};

export default Topbar;
