import React, { useState, useEffect, useMemo } from "react";
import Notification from "../../components/ui/Notification";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";
import {
  FiUserPlus,
  FiCalendar,
  FiPhone,
  FiFileText,
  FiUsers,
  FiActivity,
  FiSearch,
  FiUserCheck,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import { listClinicUsers } from "../../api/clinicUser";
import { getClinicUserDisplayName } from "../../utils/clinicUserDisplay";
import { listPatients, registerPatient, openPatientCase } from "../../api/patient";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  notes: "",
  assignedDoctorUserId: "",
};

function getDoctorLabel(doctor) {
  return getClinicUserDisplayName(doctor) === "—" ? "Mjek" : getClinicUserDisplayName(doctor);
}

function getPatientId(patient) {
  return patient?.id ?? patient?.Id ?? patient?.patientId;
}

function getPatientDisplayName(patient) {
  return `${patient?.firstName ?? patient?.FirstName ?? ""} ${patient?.lastName ?? patient?.LastName ?? ""}`.trim();
}

function formatDateDisplay(dateString) {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("sq-AL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}





function getGenderLabel(gender) {
  const g = String(gender || "").trim().toLowerCase();
  if (g === "male" || g === "mashkull") return "Mashkull";
  if (g === "female" || g === "femer" || g === "femër") return "Femër";
  if (g === "other" || g === "tjetër") return "Tjetër";
  return gender || "—";
}

function navigateAfterCase(navigate, data) {
  const caseId = data?.patientCaseId ?? data?.PatientCaseId;
  if (caseId) {
    navigate(`/dashboard/cases/${caseId}/nurse`);
  } else {
    navigate("/dashboard/cases");
  }
}

const Patients = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");

  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorsError, setDoctorsError] = useState("");

  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState({
    visible: false,
    type: "info",
    message: "",
  });

  const fetchPatients = async () => {
    setPatientsLoading(true);
    try {
      const data = await listPatients();
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      setNotif({
        visible: true,
        type: "error",
        message:
          err.response?.data?.message ||
          err.response?.data ||
          "Dështoi ngarkimi i pacientëve.",
      });
    } finally {
      setPatientsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    let active = true;
    setDoctorsLoading(true);
    setDoctorsError("");
    listClinicUsers({ role: "Doctor" })
      .then((list) => {
        if (!active) return;
        const onlyDoctors = (Array.isArray(list) ? list : []).filter((u) => {
          const r = String(u?.role ?? u?.Role ?? "").toLowerCase();
          return r === "doctor" || r === "";
        });
        setDoctors(onlyDoctors);
      })
      .catch((err) => {
        if (!active) return;
        setDoctors([]);
        setDoctorsError(
          err?.response?.status === 403
            ? "Nuk keni leje për të parë listën e mjekëve. Kontaktoni administratorin e klinikës."
            : "Lista e mjekëve nuk u ngarkua. Ju lutemi provoni përsëri."
        );
      })
      .finally(() => {
        if (active) setDoctorsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    const sorted = [...patients].sort((a, b) =>
      getPatientDisplayName(a).localeCompare(getPatientDisplayName(b), "sq")
    );
    if (!q) return sorted;
    return sorted.filter((p) => {
      const name = getPatientDisplayName(p).toLowerCase();
      const phone = String(p.phone ?? p.Phone ?? "").toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [patients, patientSearch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const selectExistingPatient = (patient) => {
    setSelectedPatient(patient);
    const lastDoctor =
      patient?.assignedDoctorUserId ?? patient?.AssignedDoctorUserId ?? "";
    setFormData((prev) => ({
      ...EMPTY_FORM,
      assignedDoctorUserId: lastDoctor || prev.assignedDoctorUserId,
      notes: "",
    }));
  };

  const selectNewPatient = () => {
    setSelectedPatient(null);
    setFormData({ ...EMPTY_FORM });
  };

  const showError = (err, fallback) => {
    let errorMessage = fallback;
    if (err.response?.status === 400) {
      errorMessage =
        err.response?.data?.message ||
        err.response?.data ||
        "Kërkesë e pavlefshme. Ju lutemi kontrolloni fushat.";
    } else if (err.response?.status === 401) {
      errorMessage = "Autentifikimi dështoi. Ju lutemi identifikohu përsëri.";
    } else if (err.response?.status === 403) {
      errorMessage = "Nuk keni leje për këtë veprim.";
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (typeof err.response?.data === "string") {
      errorMessage = err.response.data;
    }
    setNotif({ visible: true, type: "error", message: errorMessage });
  };

  const handleSubmitNew = async (e) => {
    e.preventDefault();
    if (!formData.assignedDoctorUserId) {
      setNotif({
        visible: true,
        type: "warning",
        message: "Ju lutemi zgjidhni një mjek për pacientin.",
      });
      return;
    }

    setLoading(true);
    try {
      const data = await registerPatient({
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth
          ? `${formData.dateOfBirth}T00:00:00`
          : null,
        gender: formData.gender,
        phone: formData.phone,
        notes: formData.notes,
        assignedDoctorUserId: formData.assignedDoctorUserId,
      });
      selectNewPatient();
      await fetchPatients();
      navigateAfterCase(navigate, data);
    } catch (err) {
      showError(err, "Regjistrimi i pacientit dështoi. Ju lutemi provoni përsëri.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExisting = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    if (!formData.assignedDoctorUserId) {
      setNotif({
        visible: true,
        type: "warning",
        message: "Ju lutemi zgjidhni mjekun për këtë vizitë.",
      });
      return;
    }

    setLoading(true);
    try {
      const data = await openPatientCase(getPatientId(selectedPatient), {
        assignedDoctorUserId: formData.assignedDoctorUserId,
        notes: formData.notes,
      });
      selectNewPatient();
      await fetchPatients();
      navigateAfterCase(navigate, data);
    } catch (err) {
      showError(err, "Hapja e rastit dështoi. Ju lutemi provoni përsëri.");
    } finally {
      setLoading(false);
    }
  };

  const doctorSelect = (
    <div>
      <label htmlFor="assignedDoctorUserId" className="label">
        Mjeku përgjegjës <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <FiActivity
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
          size={18}
        />
        <select
          id="assignedDoctorUserId"
          name="assignedDoctorUserId"
          value={formData.assignedDoctorUserId}
          onChange={handleChange}
          required
          disabled={doctorsLoading || doctors.length === 0}
          className="input-with-icon"
        >
          <option value="">
            {doctorsLoading
              ? "Duke ngarkuar mjekët…"
              : doctors.length === 0
                ? "Nuk ka mjekë të disponueshëm"
                : "Zgjidhni mjekun"}
          </option>
          {doctors.map((doctor) => {
            const id = doctor?.id ?? doctor?.Id;
            return (
              <option key={id} value={id}>
                {getDoctorLabel(doctor)}
              </option>
            );
          })}
        </select>
      </div>
      {doctorsError ? (
        <p className="mt-1 text-sm text-red-600">{doctorsError}</p>
      ) : (
        <p className="mt-1 text-sm text-slate-500">
          {selectedPatient
            ? "Zgjidhni mjekun për vizitën e sotme."
            : "Pacienti do t'i caktohet mjekut të zgjedhur."}
        </p>
      )}
    </div>
  );

  const notesField = (
    <div>
      <label htmlFor="notes" className="label">
        Shënime {selectedPatient ? "për vizitën" : ""}
      </label>
      <div className="relative">
        <FiFileText className="absolute left-3 top-3 text-slate-400" size={18} />
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={4}
          placeholder={
            selectedPatient
              ? "Shënime për vizitën e sotme (opsionale)…"
              : "Shënime shtesë ose informacion për pacientin…"
          }
          className="input-with-icon resize-none min-h-[7rem]"
        />
      </div>
    </div>
  );

  return (
    <>
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((prev) => ({ ...prev, visible: false }))}
      />

      <div className="page-shell max-w-6xl">
        <PageHeader
          title="Regjistro pacient"
          subtitle="Zgjidhni një pacient ekzistues për të hapur rast të ri, ose shtoni një pacient të ri."
          icon={FiUserPlus}
          actions={
            <Link to="/dashboard/patients-list" className="btn-secondary btn-md">
              <FiUsers size={18} />
              Shiko të gjithë pacientët
            </Link>
          }
        />

        <div className="grid lg:grid-cols-[minmax(260px,300px)_1fr] gap-6 items-start">
          <aside className="card flex flex-col min-h-[420px] lg:max-h-[calc(100vh-12rem)] lg:sticky lg:top-6">
            <div className="p-4 border-b border-slate-100 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pacientët e klinikës
              </p>
              <div className="relative">
                <FiSearch
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="search"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Kërko emër ose telefon…"
                  className="input pl-9 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={selectNewPatient}
                className={`w-full text-left rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                  !selectedPatient
                    ? "border-clinic-500 bg-clinic-50 text-clinic-800 ring-1 ring-clinic-300"
                    : "border-slate-200 bg-slate-50/80 text-slate-700 hover:border-clinic-200"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <FiUserPlus size={16} />
                  Pacient i ri
                </span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {patientsLoading ? (
                <LoadingSpinner className="py-10" label="Duke ngarkuar…" />
              ) : filteredPatients.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8 px-2">
                  {patientSearch
                    ? "Nuk u gjet asnjë pacient."
                    : "Ende nuk ka pacientë. Përdorni formularin djathtas."}
                </p>
              ) : (
                <ul className="space-y-1">
                  {filteredPatients.map((patient) => {
                    const id = getPatientId(patient);
                    const active = selectedPatient && getPatientId(selectedPatient) === id;
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => selectExistingPatient(patient)}
                          className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors ${
                            active
                              ? "bg-clinic-100 text-clinic-900 ring-1 ring-clinic-300"
                              : "hover:bg-slate-50 text-slate-800"
                          }`}
                        >
                          <span className="block text-sm font-medium truncate">
                            {getPatientDisplayName(patient) || "—"}
                          </span>
                          {(patient.phone ?? patient.Phone) && (
                            <span className="block text-xs text-slate-500 truncate mt-0.5">
                              {patient.phone ?? patient.Phone}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          <div className="card-padded">
            {selectedPatient ? (
              <>
                <div className="mb-6 flex items-start gap-3">
                  <span className="icon-chip-lg">
                    <FiUserCheck size={20} aria-hidden />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Hap rast për pacient ekzistues
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Të dhënat e pacientit mbeten të njëjta — zgjidhni mjekun dhe hapni rastin.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 mb-6 grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Emri
                    </p>
                    <p className="font-medium text-slate-900">
                      {getPatientDisplayName(selectedPatient)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Data e lindjes
                    </p>
                    <p className="font-medium text-slate-900">
                      {formatDateDisplay(
                        selectedPatient.dateOfBirth ?? selectedPatient.DateOfBirth
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Gjinia
                    </p>
                    <p className="font-medium text-slate-900">
                      {getGenderLabel(selectedPatient.gender ?? selectedPatient.Gender)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Telefoni
                    </p>
                    <p className="font-medium text-slate-900">
                      {selectedPatient.phone ?? selectedPatient.Phone ?? "—"}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmitExisting} className="space-y-6">
                  {doctorSelect}
                  {notesField}
                  <div className="pt-2 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary btn-lg"
                    >
                      {loading ? "Duke hapur rastin…" : "Hap rast të ri"}
                    </button>
                    <button
                      type="button"
                      onClick={selectNewPatient}
                      disabled={loading}
                      className="btn-secondary btn-md"
                    >
                      Anulo
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-slate-900">Pacient i ri</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Plotësoni të dhënat për pacientin që viziton klinikën për herë të parë.
                  </p>
                </div>

                <form onSubmit={handleSubmitNew} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="label">
                        Emri <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FiUserPlus
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                          size={18}
                        />
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          placeholder="Vendosni emrin"
                          className="input-with-icon"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="lastName" className="label">
                        Mbiemri <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FiUserPlus
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                          size={18}
                        />
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          placeholder="Vendosni mbiemrin"
                          className="input-with-icon"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="dateOfBirth" className="label">
                        Data e lindjes <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FiCalendar
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                          size={18}
                        />
                        <input
                          type="date"
                          id="dateOfBirth"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          required
                          max={new Date().toISOString().split("T")[0]}
                          className="input-with-icon"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="gender" className="label">
                        Gjinia <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        required
                        className="input"
                      >
                        <option value="">Zgjidhni gjininë</option>
                        <option value="Male">Mashkull</option>
                        <option value="Female">Femër</option>
                        <option value="Other">Tjetër</option>
                      </select>
                    </div>
                  </div>

                  {doctorSelect}

                  <div>
                    <label htmlFor="phone" className="label">
                      Numri i telefonit <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiPhone
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="+383 …"
                        className="input-with-icon"
                      />
                    </div>
                  </div>

                  {notesField}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary btn-lg w-full md:w-auto"
                    >
                      {loading ? "Duke regjistruar…" : "Regjistro pacientin"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        {!patientsLoading && patients.length === 0 && !selectedPatient && (
          <div className="mt-4">
            <EmptyState
              icon={FiUsers}
              title="Ende nuk ka pacientë"
              description="Regjistroni pacientin e parë me formularin e djathtë. Herën tjetër do të shfaqet në listën e majtë."
            />
          </div>
        )}
      </div>
    </>
  );
};

export default Patients;
