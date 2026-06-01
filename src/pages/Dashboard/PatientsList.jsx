import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import Notification from "../../components/ui/Notification";
import {
  FiUsers,
  FiRefreshCw,
  FiUserPlus,
  FiPhone,
  FiTrash2,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import ListFiltersBar from "../../components/ui/ListFiltersBar";
import { useAuth } from "../../context/AuthContext";
import { deletePatient } from "../../api/patient";
import { isClinicAdminRole } from "../../utils/dashboardMenu";

const PatientsList = () => {
  const { role } = useAuth();
  const roleLower = String(role || "").toLowerCase();
  const canDeletePatients = isClinicAdminRole(roleLower) || roleLower === "doctor" || roleLower === "superadmin";
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [deletingPatientId, setDeletingPatientId] = useState(null);
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

  const handleDeletePatient = async (patient) => {
    const id = patient.id || patient.patientId || patient.Id;
    const name = `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "pacientin";
    const ok = window.confirm(`Fshij ${name}?`);
    if (!ok) return;
    setDeletingPatientId(id);
    try {
      // Backend supports ClinicAdmin delete with no query params.
      // SuperAdmin can also delete without clinicId (clinicId is optional).
      await deletePatient(id);
      setNotif({ visible: true, type: "success", message: "Pacienti u fshi." });
      fetchPatients();
    } catch (err) {
      const serverMessage =
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message;
      setNotif({
        visible: true,
        type: "error",
        message: serverMessage || "Fshirja e pacientit dështoi.",
      });
    } finally {
      setDeletingPatientId(null);
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

  const getGenderLabel = (gender) => {
    const g = String(gender || "").trim().toLowerCase();
    if (g === "male" || g === "mashkull") return "Mashkull";
    if (g === "female" || g === "femer" || g === "femër") return "Femër";
    return gender || "N/A";
  };

  return (
    <>
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((prev) => ({ ...prev, visible: false }))}
      />

      <div className="page-shell">
        <PageHeader
          title="Pacientët"
          subtitle="Shiko dhe menaxho të gjitha të dhënat e pacientëve në klinikën tuaj."
          icon={FiUsers}
          actions={
            <>
              <button
                type="button"
                onClick={fetchPatients}
                disabled={patientsLoading}
                className="btn-secondary btn-md"
              >
                <FiRefreshCw className={patientsLoading ? "animate-spin" : ""} size={18} />
                Rifresko
              </button>
              <Link to="/dashboard/patients" className="btn-primary btn-md">
                <FiUserPlus size={18} />
                Regjistro pacient të ri
              </Link>
            </>
          }
        />

        <div className="table-shell">
          <ListFiltersBar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Kërko sipas emrit ose telefonit…"
            resultCount={filteredPatients.length}
            resultLabel="pacient"
          />

          {patientsLoading ? (
            <LoadingSpinner className="py-12" label="Duke ngarkuar pacientët…" />
          ) : filteredPatients.length === 0 ? (
            <EmptyState
              icon={FiUsers}
              title={
                searchQuery
                  ? "Nuk u gjet asnjë pacient"
                  : "Ende nuk ka pacientë të regjistruar"
              }
              description={
                searchQuery
                  ? "Provoni një kërkim tjetër sipas emrit ose telefonit."
                  : "Filloni duke regjistruar pacientin e parë në klinikë."
              }
              action={
                !searchQuery && (
                  <Link to="/dashboard/patients" className="btn-primary btn-md">
                    Regjistro pacientin e parë
                  </Link>
                )
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="table-head-row">
                      <th className="table-th">
                        Emri i pacientit
                      </th>
                      <th className="table-th">
                        Data e lindjes
                      </th>
                      <th className="table-th">
                        Mosha
                      </th>
                      <th className="table-th">
                        Gjinia
                      </th>
                      <th className="table-th">
                        Telefoni
                      </th>
                      <th className="table-th">
                        Shënime
                      </th>
                      {canDeletePatients && <th className="table-th text-right">Veprime</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((patient) => (
                      <tr
                        key={patient.id || patient.patientId}
                        className="table-row"
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
                              getGenderLabel(patient.gender) === "Mashkull"
                                ? "bg-blue-100 text-blue-800"
                                : getGenderLabel(patient.gender) === "Femër"
                                ? "bg-pink-100 text-pink-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {getGenderLabel(patient.gender)}
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
                        {canDeletePatients && (
                          <td className="py-4 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeletePatient(patient)}
                              disabled={deletingPatientId === (patient.id || patient.patientId || patient.Id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 disabled:opacity-60"
                            >
                              <FiTrash2 size={14} />
                              {deletingPatientId === (patient.id || patient.patientId || patient.Id)
                                ? "Duke fshirë..."
                                : "Fshij"}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default PatientsList;
