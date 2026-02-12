import React, { useState, useEffect, useCallback } from "react";
import { FiUserCheck, FiUserPlus, FiMail, FiRefreshCw } from "react-icons/fi";
import Notification from "../../ui/Notification";
import { listClinicUsers, createClinicUser } from "../../../api/clinicUser";
import { useAuth } from "../../../context/AuthContext";
import { getClinicId } from "../../../utils/clinicId";

const ROLES = [
  { value: "Doctor", label: "Mjek" },
  { value: "Nurse", label: "Infermier" },
  { value: "LabTechnician", label: "Teknikian laboratori" },
];

function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(dateString);
  }
}

export default function Staff() {
  const { role } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [notif, setNotif] = useState({ visible: false, type: "info", message: "" });
  const [form, setForm] = useState({ email: "", password: "", role: "Nurse" });
  const [submitting, setSubmitting] = useState(false);

  const isClinicAdmin = role && role.toString().toLowerCase() === "clinicadmin";
  const isSuperAdmin = role && role.toString().toLowerCase() === "superadmin";
  const canManageStaff = isClinicAdmin || isSuperAdmin;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (isSuperAdmin) params.clinicId = getClinicId();
      const list = await listClinicUsers(params);
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      setNotif({
        visible: true,
        type: "error",
        message: err.response?.data?.message ?? err.response?.data ?? "Dështoi ngarkimi i stafit.",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, isSuperAdmin]);

  useEffect(() => {
    if (canManageStaff) fetchUsers();
  }, [canManageStaff, fetchUsers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createClinicUser(
        { email: form.email, password: form.password, role: form.role },
        isSuperAdmin ? getClinicId() : undefined
      );
      setNotif({ visible: true, type: "success", message: "Përdoruesi i stafit u krijua. Mund të identifikohen me këtë email dhe fjalëkalim." });
      setForm({ email: "", password: "", role: "Nurse" });
      fetchUsers();
    } catch (err) {
      setNotif({
        visible: true,
        type: "error",
        message: err.response?.data?.message ?? err.response?.data ?? "Dështoi krijimi i përdoruesit.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManageStaff) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-slate-600">Nuk keni leje për të menaxhuar stafin.</p>
      </div>
    );
  }

  return (
    <>
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((p) => ({ ...p, visible: false }))}
      />

      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <FiUserCheck className="text-[#81a2c5]" size={32} />
              Stafi
            </h1>
            <p className="text-slate-600 mt-1">
              Menaxho përdoruesit e klinikës: mjekët, infermierët, teknikianët e laboratorit.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
            Rifresko
          </button>
        </div>

        {/* Create user form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FiUserPlus className="text-[#81a2c5]" size={20} />
            Shto anëtar stafi
          </h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
                placeholder="perdorues@klinika.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fjalëkalimi *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Roli *</label>
              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent bg-white"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#81a2c5] text-white font-medium rounded-lg hover:bg-[#6b8fa8] disabled:opacity-50"
            >
              {submitting ? "Duke krijuar…" : "Krijo përdoruesin"}
            </button>
          </form>
        </div>

        {/* Role filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRoleFilter("")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${!roleFilter ? "bg-[#81a2c5] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            Të gjitha
          </button>
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRoleFilter(r.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${roleFilter === r.value ? "bg-[#81a2c5] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* User list */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <svg className="animate-spin h-8 w-8 text-[#81a2c5]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <FiUserCheck className="mx-auto mb-4 text-slate-300" size={48} />
              <p>Ende nuk ka përdorues stafi. Krijo një më sipër.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {users.map((u) => {
                const id = u.id ?? u.Id;
                const email = u.email ?? u.Email ?? "—";
                const userRole = u.role ?? u.Role ?? "—";
                const isActive = u.isActive ?? u.IsActive ?? true;
                const createdAt = u.createdAt ?? u.CreatedAt;
                return (
                  <li key={id} className="flex flex-wrap items-center gap-4 px-6 py-4 hover:bg-slate-50">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#81a2c5]/10 flex items-center justify-center">
                        <FiMail className="text-[#81a2c5]" size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 truncate">{email}</p>
                        <p className="text-sm text-slate-500">
                          {userRole} · {formatDate(createdAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isActive ? "Aktiv" : "Joaktiv"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
