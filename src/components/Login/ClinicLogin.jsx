import React from "react";
import entryImg from "../../assets/images/entry.jpg";
import ClinicLoginForm from "./ClinicLoginForm";

const ClinicLogin = () => {
  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden">
      <div className="hidden lg:block lg:w-1/2 relative">
        <img src={entryImg} alt="Klinikë moderne" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-clinic-900/40 to-transparent" />
        <div className="absolute bottom-8 left-8 right-8 text-white">
          <p className="text-sm font-medium text-white/80 mb-1">iKlinika</p>
          <p className="text-xl font-semibold max-w-sm">
            Menaxhim i thjeshtë për pacientët, rastet dhe ekipin tuaj mjekësor.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-md">
          <ClinicLoginForm />
        </div>
      </div>
    </div>
  );
};

export default ClinicLogin;
