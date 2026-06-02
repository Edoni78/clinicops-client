import React, { useState, useEffect, useCallback } from "react";
import { FiUserCheck, FiUserPlus, FiUser, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import Notification from "../../ui/Notification";
import { useConfirmModal } from "../../ui/ConfirmModal";
import PageHeader from "../../ui/PageHeader";
import LoadingSpinner from "../../ui/LoadingSpinner";
import EmptyState from "../../ui/EmptyState";
import { listClinicUsers, createClinicUser, deleteClinicUser } from "../../../api/clinicUser";
import {
  getClinicUserDisplayName,
  getClinicUserEmail,
  getClinicUserRoleLabel,
} from "../../../utils/clinicUserDisplay";
import { useAuth } from "../../../context/AuthContext";
import { useDashboardPanel, PANEL_SUPERADMIN } from "../../../context/DashboardPanelContext";
import { getClinicId } from "../../../utils/clinicId";
import { Navigate } from "react-router-dom";
import { CLINIC_MODE_SOLO_DOCTOR } from "../../../utils/clinicMode";
import { isClinicAdminRole } from "../../../utils/dashboardMenu";

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
  const { role, clinicMode } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [notif, setNotif] = useState({ visible: false, type: "info", message: "" });
  const [form, setForm] = useState({ displayName: "", email: "", password: "", role: "Doctor" });
  const [submitting, setSubmitting] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const { confirm, ConfirmDialog } = useConfirmModal();

  const isClinicAdmin = isClinicAdminRole(role);
  const isSuperAdmin = role && role.toString().toLowerCase() === "superadmin";
  const { activePanel } = useDashboardPanel();
  const canManageStaff = isClinicAdmin || isSuperAdmin;
  const superAdminInCorrectPanel = !isSuperAdmin || activePanel === PANEL_SUPERADMIN;
  const roleOptions =
    clinicMode === CLINIC_MODE_SOLO_DOCTOR
      ? ROLES.filter((r) => r.value === "Doctor")
      : ROLES;

  useEffect(() => {
    if (!roleOptions.some((r) => r.value === form.role)) {
      setForm((p) => ({ ...p, role: roleOptions[0]?.value || "Doctor" }));
    }
  }, [roleOptions, form.role]);

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
        {
          displayName: form.displayName.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        },
        isSuperAdmin ? getClinicId() : undefined
      );
      setNotif({
        visible: true,
        type: "success",
        message: "Anëtari i stafit u krijua. Mund të identifikohet me email dhe fjalëkalim.",
      });
      setForm({ displayName: "", email: "", password: "", role: roleOptions[0]?.value || "Doctor" });
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

  const requestDeleteUser = async (id, displayName) => {
    const ok = await confirm({
      title: "Fshij përdoruesin",
      message: `Fshij anëtarin e stafit «${displayName}»? Llogaria nuk do të ketë më akses në sistem.`,
      confirmLabel: "Fshij",
      cancelLabel: "Anulo",
      variant: "danger",
    });
    if (!ok) return;
    setDeletingUserId(id);
    try {
      await deleteClinicUser(id, isSuperAdmin ? getClinicId() : undefined);
      setNotif({ visible: true, type: "success", message: "Përdoruesi u fshi." });
      fetchUsers();
    } catch (err) {
      setNotif({
        visible: true,
        type: "error",
        message: err.response?.data?.message ?? err.response?.data ?? "Fshirja dështoi.",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  if (!canManageStaff) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-slate-600">Nuk keni leje për të menaxhuar stafin.</p>
      </div>
    );
  }

  if (isSuperAdmin && !superAdminInCorrectPanel) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <ConfirmDialog />
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((p) => ({ ...p, visible: false }))}
      />

      <div className="page-shell max-w-5xl">
        <PageHeader
          title="Stafi"
          subtitle="Menaxho përdoruesit e klinikës: mjekët, infermierët, teknikianët e laboratorit."
          icon={FiUserCheck}
          actions={
            <button type="button" onClick={fetchUsers} disabled={loading} className="btn-secondary btn-md">
              <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
              Rifresko
            </button>
          }
        />

        <div className="card p-5 sm:p-6 mb-6">
          <h2 className="section-heading mb-4 flex items-center gap-2">
            <FiUserPlus className="text-clinic-600" size={18} />
            Shto anëtar stafi
          </h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className="label">Emri *</label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                required
                maxLength={200}
                placeholder="p.sh. Dr. Ana Krasniqi"
                className="input"
              />
            </div>
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
                placeholder="perdorues@klinika.com"
                className="input"
              />
            </div>
            <div>
              <label className="label">Fjalëkalimi *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
                minLength={6}
                placeholder="••••••••"
                className="input"
              />
            </div>
            <div>
              <label className="label">Roli *</label>
              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                className="input"
              >
                {roleOptions.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary btn-md w-full"
            >
              {submitting ? "Duke krijuar…" : "Krijo përdoruesin"}
            </button>
          </form>
        </div>

        <div className="mb-4 filter-bar">
          <button
            type="button"
            onClick={() => setRoleFilter("")}
            className={!roleFilter ? "tab-active" : "tab-inactive"}
          >
            Të gjitha
          </button>
          {roleOptions.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRoleFilter(r.value)}
              className={roleFilter === r.value ? "tab-active" : "tab-inactive"}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="list-shell">
          {loading ? (
            <LoadingSpinner className="py-16" label="Duke ngarkuar stafin…" />
          ) : users.length === 0 ? (
            <EmptyState
              icon={FiUserCheck}
              title="Ende nuk ka përdorues stafi"
              description="Krijo një përdorues më sipër."
            />
          ) : (
            <ul>
              {users.map((u) => {
                const id = u.id ?? u.Id;
                const displayName = getClinicUserDisplayName(u);
                const email = getClinicUserEmail(u);
                const userRole = u.role ?? u.Role ?? "—";
                const isActive = u.isActive ?? u.IsActive ?? true;
                const createdAt = u.createdAt ?? u.CreatedAt;
                return (
                  <li key={id} className="list-row">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="icon-chip">
                        <FiUser size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">{displayName}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {getClinicUserRoleLabel(userRole)} · {email}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(createdAt)}</p>
                      </div>
                    </div>
                    <span className={isActive ? "badge-success" : "badge-neutral"}>
                      {isActive ? "Aktiv" : "Joaktiv"}
                    </span>
                    <button
                      type="button"
                      onClick={() => requestDeleteUser(id, displayName)}
                      disabled={deletingUserId === id}
                      className="btn-danger btn-sm"
                    >
                      <FiTrash2 size={14} />
                      {deletingUserId === id ? "Duke fshirë..." : "Fshij"}
                    </button>
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
