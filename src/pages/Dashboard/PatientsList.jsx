import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import Notification from "../../components/ui/Notification";
import { useConfirmModal } from "../../components/ui/ConfirmModal";
import {
  FiUsers,
  FiRefreshCw,
  FiUserPlus,
  FiTrash2,
  FiUploadCloud,
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
  const canImportPatients = isClinicAdminRole(roleLower);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [deletingPatientId, setDeletingPatientId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [notif, setNotif] = useState({
    visible: false,
    type: "info",
    message: "",
  });
  const { confirm, ConfirmDialog } = useConfirmModal();

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

  const requestDeletePatient = async (patient) => {
    const id = patient.id || patient.patientId || patient.Id;
    const name = `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "pacientin";
    const ok = await confirm({
      title: "Fshij pacientin",
      message: `Fshij ${name}? Të dhënat e pacientit do të hiqen nga klinika.`,
      confirmLabel: "Fshij",
      cancelLabel: "Anulo",
      variant: "danger",
    });
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
    const id = String(patient.id || patient.patientId || patient.Id || "").toLowerCase();
    return fullName.includes(query) || phone.includes(query) || id.includes(query);
  });

  const patientRowId = (patient) => patient.id || patient.patientId || patient.Id;

  const toggleSelected = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const allVisibleIds = filteredPatients.map(patientRowId).filter(Boolean);
  const allVisibleSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.includes(id));

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allVisibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allVisibleIds])));
    }
  };

  const requestDeleteSelected = async () => {
    if (!selectedIds.length) return;
    const ok = await confirm({
      title: "Fshij pacientët e zgjedhur",
      message: `Fshij ${selectedIds.length} pacientë? Të dhënat do të hiqen nga klinika.`,
      confirmLabel: "Fshij",
      cancelLabel: "Anulo",
      variant: "danger",
    });
    if (!ok) return;
    try {
      for (const id of selectedIds) {
        await deletePatient(id);
      }
      setSelectedIds([]);
      setNotif({ visible: true, type: "success", message: "Pacientët e zgjedhur u fshinë." });
      fetchPatients();
    } catch (err) {
      const serverMessage =
        typeof err.response?.data === "string" ? err.response.data : err.response?.data?.message;
      setNotif({
        visible: true,
        type: "error",
        message: serverMessage || "Fshirja dështoi.",
      });
    }
  };

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
      <ConfirmDialog />
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((prev) => ({ ...prev, visible: false }))}
      />

      <div className="page-shell">
        <PageHeader
          title="Pacientët"
          subtitle="Lista e pacientëve të klinikës."
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
              {canImportPatients && (
                <Link to="/dashboard/patients-import" className="btn-secondary btn-md">
                  <FiUploadCloud size={18} />
                  Importo pacientë
                </Link>
              )}
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
                  ? "Provoni një kërkim tjetër sipas emrit, telefonit ose ID."
                  : "Regjistroni pacientin e parë për të filluar radhën e sotme."
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
              {selectedIds.length > 0 && (
                <div className="bulk-bar">
                  <span className="font-medium text-slate-800 tabular-nums">{selectedIds.length} të zgjedhur</span>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => setSelectedIds([])}>
                    Pastro
                  </button>
                  {canDeletePatients && (
                    <button type="button" className="btn-danger btn-sm" onClick={requestDeleteSelected}>
                      Fshij të zgjedhurit
                    </button>
                  )}
                </div>
              )}
              <div className="table-scroll">
                <table className="w-full">
                  <thead>
                    <tr className="table-head-row">
                      <th className="table-th w-8">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleAllVisible}
                          aria-label="Zgjidh të gjithë"
                        />
                      </th>
                      <th className="table-th">Emri</th>
                      <th className="table-th">ID</th>
                      <th className="table-th">Lindja</th>
                      <th className="table-th">Mosha</th>
                      <th className="table-th">Gjinia</th>
                      <th className="table-th">Telefoni</th>
                      <th className="table-th">Shënime</th>
                      {canDeletePatients && <th className="table-th text-right">Veprime</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((patient) => {
                      const id = patientRowId(patient);
                      return (
                      <tr
                        key={id}
                        className="table-row"
                      >
                        <td className="table-td">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(id)}
                            onChange={() => toggleSelected(id)}
                            aria-label={`Zgjidh ${patient.firstName} ${patient.lastName}`}
                          />
                        </td>
                        <td className="table-td">
                          <div className="font-medium text-slate-900">
                            {patient.firstName} {patient.lastName}
                          </div>
                        </td>
                        <td className="table-td">
                          <span className="font-mono text-xs tabular-nums text-slate-500">{id || "—"}</span>
                        </td>
                        <td className="table-td tabular-nums text-slate-600">
                          {formatDate(patient.dateOfBirth)}
                        </td>
                        <td className="table-td tabular-nums text-slate-600">
                          {calculateAge(patient.dateOfBirth)}
                        </td>
                        <td className="table-td">
                          <span className="badge-neutral">
                            {getGenderLabel(patient.gender)}
                          </span>
                        </td>
                        <td className="table-td tabular-nums text-slate-600">
                          {patient.phone || "N/A"}
                        </td>
                        <td className="table-td text-slate-600">
                          <div className="max-w-xs truncate" title={patient.notes}>
                            {patient.notes || "—"}
                          </div>
                        </td>
                        {canDeletePatients && (
                          <td className="table-td text-right">
                            <button
                              type="button"
                              onClick={() => requestDeletePatient(patient)}
                              disabled={deletingPatientId === id}
                              className="btn-danger btn-sm"
                            >
                              <FiTrash2 size={14} />
                              {deletingPatientId === id ? "Duke fshirë..." : "Fshij"}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                    })}
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
