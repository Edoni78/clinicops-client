import React, { useState } from "react";
import api from "../../api/axios";
import Notification from "../../components/ui/Notification";
import { getJwtPayload } from "../../utils/jwt";
import { FiUserPlus, FiCalendar, FiPhone, FiFileText, FiUsers } from "react-icons/fi";
import { Link } from "react-router-dom";

const Patients = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState({
    visible: false,
    type: "info",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get ClinicId from JWT token (check multiple possible property names)
      const payload = getJwtPayload();
      let clinicId =
        payload?.clinicId ||
        payload?.ClinicId ||
        payload?.clinic_id ||
        payload?.Clinic_ID;

      // If no clinicId in token, use default test clinic GUID (for SuperAdmin)
      // This matches the backend default: 11111111-1111-1111-1111-111111111111
      if (!clinicId) {
        clinicId = "11111111-1111-1111-1111-111111111111";
      }

      // Prepare request data with ClinicId
      const requestData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth
          ? `${formData.dateOfBirth}T00:00:00`
          : null,
        gender: formData.gender,
        phone: formData.phone,
        notes: formData.notes || "",
        clinicId: clinicId,
      };

      await api.post("/api/Patient/register", requestData);

      setNotif({
        visible: true,
        type: "success",
        message: "Pacienti u regjistrua me sukses!",
      });

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        phone: "",
        notes: "",
      });
    } catch (err) {
      let errorMessage = "Regjistrimi i pacientit dështoi. Ju lutemi provoni përsëri.";

      if (err.response?.status === 400) {
        errorMessage =
          err.response?.data?.message ||
          err.response?.data ||
          "Kërkesë e pavlefshme. Ju lutemi kontrolloni të gjitha fushat.";
      } else if (err.response?.status === 401) {
        errorMessage = "Autentifikimi dështoi. Ju lutemi identifikohu përsëri.";
      } else if (err.response?.status === 403) {
        errorMessage = "Nuk keni leje për të regjistruar pacientë.";
      } else if (err.response?.status === 404) {
        errorMessage = "Pika e API nuk u gjet. Ju lutemi kontrolloni konfigurimin e serverit.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data) {
        errorMessage =
          typeof err.response.data === "string"
            ? err.response.data
            : JSON.stringify(err.response.data);
      }

      setNotif({
        visible: true,
        type: "error",
        message: errorMessage,
      });
    } finally {
      setLoading(false);
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

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <FiUserPlus className="text-[#81a2c5]" size={32} />
              Regjistro pacient të ri
            </h1>
            <p className="text-slate-600">
              Shto një pacient të ri në sistemin e klinikës. Plotësoni të gjitha
              fushat e kërkuara më poshtë.
            </p>
          </div>
          <Link
            to="/dashboard/patients-list"
            className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-lg
              shadow-sm hover:bg-slate-200 transition-all duration-200
              flex items-center gap-2"
          >
            <FiUsers size={18} />
            Shiko të gjithë pacientët
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
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
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent
                      transition-all duration-200"
                  />
                </div>
              </div>

              {/* Last Name */}
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
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
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent
                      transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Date of Birth and Gender Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date of Birth */}
              <div>
                <label
                  htmlFor="dateOfBirth"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
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
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent
                      transition-all duration-200"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label
                  htmlFor="gender"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Gjinia <span className="text-red-500">*</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent
                    transition-all duration-200 bg-white"
                >
                  <option value="">Zgjidhni gjininë</option>
                  <option value="Male">Mashkull</option>
                  <option value="Female">Femër</option>
                  <option value="Other">Tjetër</option>
                </select>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
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
                  placeholder="+1234567890"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent
                    transition-all duration-200"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Shënime
              </label>
              <div className="relative">
                <FiFileText
                  className="absolute left-3 top-3 text-slate-400"
                  size={18}
                />
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Shënime shtesë ose informacion për pacientin..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent
                    transition-all duration-200 resize-none"
                />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Opsional: Shtoni historikun mjekësor ose shënime të rëndësishme
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-8 py-3 bg-[#81a2c5] text-white font-semibold
                  rounded-lg shadow-sm hover:bg-[#6b8fa8] focus:outline-none focus:ring-2
                  focus:ring-[#81a2c5] focus:ring-offset-2 transition-all duration-200
                  disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
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
                    Duke regjistruar...
                  </>
                ) : (
                  <>
                    <FiUserPlus size={18} />
                    Regjistro pacientin
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Patients;
