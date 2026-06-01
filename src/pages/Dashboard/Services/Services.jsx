import React, { useState, useEffect, useCallback } from "react";
import {
  FiPackage,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";
import Notification from "../../../components/ui/Notification";
import PageHeader from "../../../components/ui/PageHeader";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import EmptyState from "../../../components/ui/EmptyState";
import { listServices, createService, updateService, deleteService } from "../../../api/service";
import { useAuth } from "../../../context/AuthContext";
import { useDashboardPanel, PANEL_SUPERADMIN } from "../../../context/DashboardPanelContext";
import { getClinicId } from "../../../utils/clinicId";
import { Navigate } from "react-router-dom";

const NAME_MAX = 300;
const PRICE_MIN = 0;

function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleString("sq-AL", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return String(dateString);
  }
}

function validateForm(name, price) {
  const errors = [];
  if (name == null || String(name).trim() === "") errors.push("Emri është i detyrueshëm.");
  else if (String(name).length > NAME_MAX) errors.push(`Emri nuk duhet të kalojë ${NAME_MAX} karaktere.`);
  const p = Number(price);
  if (price === "" || price == null || Number.isNaN(p)) errors.push("Çmimi është i detyrueshëm.");
  else if (p < PRICE_MIN) errors.push("Çmimi duhet të jetë ≥ 0.");
  return errors;
}

export default function Services() {
  const { user, role } = useAuth();
  const isSuperAdmin = role && role.toString().toLowerCase() === "superadmin";
  const { activePanel, requiresPanel } = useDashboardPanel();
  const clinicIdParam = isSuperAdmin ? getClinicId() : undefined;
  const hasClinic = !!(user?.clinicId ?? user?.ClinicId) || isSuperAdmin;

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState({ visible: false, type: "info", message: "" });
  const [addForm, setAddForm] = useState({ name: "", price: "" });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addErrors, setAddErrors] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", price: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editErrors, setEditErrors] = useState([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const fetchServices = useCallback(async () => {
    if (!hasClinic) return;
    setLoading(true);
    try {
      const list = await listServices(clinicIdParam);
      setServices(Array.isArray(list) ? list : []);
    } catch (err) {
      setNotif({
        visible: true,
        type: "error",
        message: err.response?.data?.message ?? err.response?.data ?? "Dështoi ngarkimi i shërbimeve.",
      });
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [hasClinic, clinicIdParam]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const name = String(addForm.name ?? "").trim();
    const price = addForm.price;
    const errors = validateForm(name, price);
    setAddErrors(errors);
    if (errors.length > 0) return;
    setAddSubmitting(true);
    try {
      await createService({ name, price: Number(price) }, clinicIdParam);
      setNotif({ visible: true, type: "success", message: "Shërbimi u shtua." });
      setAddForm({ name: "", price: "" });
      setAddErrors([]);
      fetchServices();
    } catch (err) {
      setNotif({
        visible: true,
        type: "error",
        message: err.response?.data?.message ?? err.response?.data ?? "Dështoi shtimi i shërbimit.",
      });
    } finally {
      setAddSubmitting(false);
    }
  };

  const openEdit = (s) => {
    const id = s.id ?? s.Id;
    setEditingId(id);
    setEditForm({
      name: s.name ?? s.Name ?? "",
      price: String(s.price ?? s.Price ?? ""),
    });
    setEditErrors([]);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    const name = String(editForm.name ?? "").trim();
    const price = editForm.price;
    const errors = validateForm(name, price);
    setEditErrors(errors);
    if (errors.length > 0) return;
    setEditSubmitting(true);
    try {
      await updateService(editingId, { name, price: Number(price) }, clinicIdParam);
      setNotif({ visible: true, type: "success", message: "Shërbimi u përditësua." });
      setEditingId(null);
      fetchServices();
    } catch (err) {
      setNotif({
        visible: true,
        type: "error",
        message: err.response?.data?.message ?? err.response?.data ?? "Dështoi përditësimi.",
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    setDeleteSubmitting(true);
    try {
      await deleteService(deleteConfirmId, clinicIdParam);
      setNotif({ visible: true, type: "success", message: "Shërbimi u hoq." });
      setDeleteConfirmId(null);
      fetchServices();
    } catch (err) {
      setNotif({
        visible: true,
        type: "error",
        message: err.response?.data?.message ?? err.response?.data ?? "Dështoi fshirja.",
      });
    } finally {
      setDeleteSubmitting(false);
    }
  };

  if (requiresPanel && activePanel !== PANEL_SUPERADMIN) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!hasClinic) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-slate-600">Nuk keni qasje në shërbimet e klinikës.</p>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-4xl">
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((p) => ({ ...p, visible: false }))}
      />

      <PageHeader
        title="Shërbimet"
        subtitle="Emrat dhe çmimet e shërbimeve të klinikës. Shtoni, ndryshoni ose fshini shërbime."
        icon={FiPackage}
        actions={
          <button type="button" onClick={() => fetchServices()} disabled={loading} className="btn-secondary btn-md">
            <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
            Rifresko
          </button>
        }
      />

      <div className="card p-5 sm:p-6 mb-6">
        <h2 className="section-heading mb-4 flex items-center gap-2">
          <FiPlus size={18} className="text-clinic-600" />
          Shto shërbim
        </h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row sm:items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Emri</label>
            <input
              type="text"
              value={addForm.name}
              onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
              maxLength={NAME_MAX + 1}
              className="input"
              placeholder="p.sh. Kontrolle + Analiza"
            />
            <p className="text-xs text-slate-500 mt-1">{addForm.name.length}/{NAME_MAX}</p>
          </div>
          <div className="w-full sm:w-32">
            <label className="label">Çmimi</label>
            <input
              type="number"
              step="0.01"
              min={PRICE_MIN}
              value={addForm.price}
              onChange={(e) => setAddForm((p) => ({ ...p, price: e.target.value }))}
              className="input"
              placeholder="0"
            />
          </div>
          <button type="submit" disabled={addSubmitting} className="btn-primary btn-md">
            {addSubmitting ? "Duke shtuar…" : "Shto"}
          </button>
        </form>
        {addErrors.length > 0 && (
          <ul className="mt-3 text-sm text-red-600 list-disc list-inside">
            {addErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="table-shell">
        {loading ? (
          <LoadingSpinner className="py-16" label="Duke ngarkuar…" />
        ) : services.length === 0 ? (
          <EmptyState
            icon={FiPackage}
            title="Nuk ka shërbime ende"
            description="Shtoni një shërbim më sipër."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-head-row">
                  <th className="table-th">Emri</th>
                  <th className="table-th">Çmimi</th>
                  <th className="table-th">Data</th>
                  <th className="table-th text-right w-28">Veprime</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => {
                  const id = s.id ?? s.Id;
                  const name = s.name ?? s.Name ?? "—";
                  const price = s.price ?? s.Price;
                  const createdAt = s.createdAt ?? s.CreatedAt;
                  return (
                    <tr key={id} className="table-row">
                      <td className="table-td font-medium text-slate-900">{name}</td>
                      <td className="table-td tabular-nums">
                        {typeof price === "number" ? price.toFixed(2) : price}
                      </td>
                      <td className="table-td text-slate-500">{formatDate(createdAt)}</td>
                      <td className="table-td text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(s)}
                            className="btn-icon"
                            title="Ndrysho"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(id)}
                            className="btn-icon-danger"
                            title="Fshi"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingId && (
        <div className="modal-overlay" onClick={() => !editSubmitting && setEditingId(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-heading">Ndrysho shërbimin</h2>
              <button
                type="button"
                onClick={() => !editSubmitting && setEditingId(null)}
                className="btn-icon"
              >
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="label">Emri</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  maxLength={NAME_MAX + 1}
                  className="input"
                />
                <p className="text-xs text-slate-500 mt-1">{editForm.name.length}/{NAME_MAX}</p>
              </div>
              <div>
                <label className="label">Çmimi</label>
                <input
                  type="number"
                  step="0.01"
                  min={PRICE_MIN}
                  value={editForm.price}
                  onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))}
                  className="input"
                />
              </div>
              {editErrors.length > 0 && (
                <ul className="text-sm text-red-600 list-disc list-inside">
                  {editErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => !editSubmitting && setEditingId(null)}
                  className="btn-secondary btn-md"
                >
                  Anulo
                </button>
                <button type="submit" disabled={editSubmitting} className="btn-primary btn-md">
                  {editSubmitting ? "Duke ruajtur…" : "Ruaj"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => !deleteSubmitting && setDeleteConfirmId(null)}>
          <div className="modal-panel-sm" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm text-slate-700 leading-relaxed mb-5">
              A jeni të sigurt që dëshironi ta fshini këtë shërbim? Nuk do të shfaqet më në listë.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => !deleteSubmitting && setDeleteConfirmId(null)}
                disabled={deleteSubmitting}
                className="btn-secondary btn-md"
              >
                Anulo
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteSubmitting}
                className="btn-danger btn-md bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700"
              >
                {deleteSubmitting ? "Duke fshirë…" : "Fshi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
