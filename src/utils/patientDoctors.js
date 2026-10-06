export function patientDoctors(patient) {
  return Array.isArray(patient?.doctors) ? patient.doctors : [];
}

export function patientDoctorLabel(patient) {
  const names = patient?.doctorNames || patientDoctors(patient).map((doctor) => doctor.name).filter(Boolean);
  const label = Array.isArray(names) ? names.join(", ") : String(names || "");
  return label.trim() || "—";
}

export function patientAssignedToDoctor(patient, doctorId) {
  if (!doctorId) return false;
  return patientDoctors(patient).some((doctor) => doctor.id === doctorId);
}

export function patientMatchesDoctorFilter(patient, doctorFilter) {
  if (!doctorFilter) return true;
  if (doctorFilter === "none") return patientDoctors(patient).length === 0;
  return patientAssignedToDoctor(patient, doctorFilter);
}

export function doctorFilterOptions(patients, { includeUnassigned = true } = {}) {
  const names = new Map();
  (patients || []).forEach((patient) => {
    patientDoctors(patient).forEach((doctor) => {
      if (doctor?.id && !names.has(doctor.id)) names.set(doctor.id, doctor.name || "Mjek");
    });
  });
  const options = [...names.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "sq"));
  if (includeUnassigned && (patients || []).some((patient) => patientDoctors(patient).length === 0)) {
    options.push({ value: "none", label: "Pa mjek" });
  }
  return options;
}
