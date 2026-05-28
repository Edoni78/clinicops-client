import React from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import ClinicApply from "../../components/CreateClinic/ClinicApply";

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-clinic-400 transition-colors"
          >
            <FiArrowLeft size={18} />
            Kthehu në faqe kryesore
          </Link>
          <Link to="/" className="text-lg font-bold text-clinic-400">
            iKlinika
          </Link>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <ClinicApply />
      </div>
    </div>
  );
}
