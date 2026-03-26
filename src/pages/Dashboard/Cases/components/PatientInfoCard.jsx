import React from "react";
import { FiPhone, FiUser } from "react-icons/fi";

export default function PatientInfoCard({
  patientDisplayName,
  patientGender,
  patientPhone,
  caseStatus,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7 mb-7">
      <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <FiUser className="text-[#81a2c5]" />
        Pacienti
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div>
          <p className="text-sm text-slate-500">Emri</p>
          <p className="font-medium text-slate-900">{patientDisplayName}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Gjinia</p>
          <p className="font-medium text-slate-900">{patientGender}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500 flex items-center gap-1">
            <FiPhone size={12} />
            Numri i telefonit
          </p>
          <p className="font-medium text-slate-900">{patientPhone}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Statusi</p>
          <p className="font-medium text-slate-900">{caseStatus}</p>
        </div>
      </div>
    </div>
  );
}
