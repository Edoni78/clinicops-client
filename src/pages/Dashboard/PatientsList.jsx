import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import Notification from "../../components/ui/Notification";
import {
  FiUsers,
  FiRefreshCw,
  FiSearch,
  FiUserPlus,
  FiPhone
} from "react-icons/fi";
import { Link } from "react-router-dom";

const PatientsList = () => {
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [notif, setNotif] = useState({
    visible: false,
    type: "info",
    message: "",
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setPatientsLoading(true);
    try {
      const response = await api.get("/api/Patient");
      setPatients(response.data || []);
    } catch (err) {
      setNotif({
        visible: true,
        type: "error",
        message:
          err.response?.data?.message ||
          err.response?.data ||
          "Dështoi ngarkimi i pacientëve. Ju lutemi provoni përsëri.",
      });
    } finally {
      setPatientsLoading(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${patient.firstName || ""} ${patient.lastName || ""}`.toLowerCase();
    const phone = (patient.phone || "").toLowerCase();
    return fullName.includes(query) || phone.includes(query);
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "N/A";
    try {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch {
      return "N/A";
    }
  };

  return (
    <>
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((prev) => ({ ...prev, visible: false }))}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <FiUsers className="text-[#81a2c5]" size={32} />
              Pacientët
            </h1>
            <p className="text-slate-600">
              Shiko dhe menaxho të gjitha të dhënat e pacientëve në klinikën tuaj.
            </p>
          </div>
          <Link
            to="/dashboard/patients"
            className="px-6 py-3 bg-[#81a2c5] text-white font-semibold rounded-lg
              shadow-sm hover:bg-[#6b8fa8] transition-all duration-200
              flex items-center gap-2"
          >
            <FiUserPlus size={18} />
            Regjistro pacient të ri
          </Link>
        </div>

        {/* Search and Refresh Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Kërko sipas emrit ose telefonit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
              />
            </div>
            <button
              onClick={fetchPatients}
              disabled={patientsLoading}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200
                transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              <FiRefreshCw
                className={patientsLoading ? "animate-spin" : ""}
                size={18}
              />
              Rifresko
            </button>
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {patientsLoading ? (
            <div className="flex justify-center items-center py-12">
              <svg
                className="animate-spin h-8 w-8 text-[#81a2c5]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <FiUsers className="mx-auto text-slate-400 mb-4" size={48} />
              <p className="text-slate-600 text-lg">
                {searchQuery
                  ? "Nuk u gjet asnjë pacient që përputhet me kërkimin."
                  : "Ende nuk ka pacientë të regjistruar."}
              </p>
              {!searchQuery && (
                <Link
                  to="/dashboard/patients"
                  className="mt-4 inline-block px-6 py-2 bg-[#81a2c5] text-white rounded-lg hover:bg-[#6b8fa8]
                    transition-colors duration-200"
                >
                  Regjistro pacientin e parë
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        Emri i pacientit
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        Data e lindjes
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        Mosha
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        Gjinia
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        Telefoni
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        Shënime
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((patient) => (
                      <tr
                        key={patient.id || patient.patientId}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="font-medium text-slate-900">
                            {patient.firstName} {patient.lastName}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          {formatDate(patient.dateOfBirth)}
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          {calculateAge(patient.dateOfBirth)} vjet
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              patient.gender === "Male"
                                ? "bg-blue-100 text-blue-800"
                                : patient.gender === "Female"
                                ? "bg-pink-100 text-pink-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {patient.gender || "N/A"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          <div className="flex items-center gap-2">
                            <FiPhone size={14} className="text-slate-400" />
                            {patient.phone || "N/A"}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          <div className="max-w-xs truncate" title={patient.notes}>
                            {patient.notes || "-"}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-sm text-slate-600">
                Duke shfaqur {filteredPatients.length} nga {patients.length} pacientë
                {searchQuery && ` që përputhen me "${searchQuery}"`}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default PatientsList;
