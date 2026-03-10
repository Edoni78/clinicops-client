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
import { listServices, createService, updateService, deleteService } from "../../../api/service";
import { useAuth } from "../../../context/AuthContext";
import { getClinicId } from "../../../utils/clinicId";

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

  if (!hasClinic) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-slate-600">Nuk keni qasje në shërbimet e klinikës.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Notification
        visible={notif.visible}
        type={notif.type}
        message={notif.message}
        onClose={() => setNotif((p) => ({ ...p, visible: false }))}
      />

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-[#81a2c5] text-white shadow-lg">
              <FiPackage size={28} />
            </span>
            Shërbimet
          </h1>
          <p className="text-slate-600 mt-2 text-sm">
            Emrat dhe çmimet e shërbimeve të klinikës. Shtoni, ndryshoni ose fshini shërbime.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchServices()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} size={18} />
          Rifresko
        </button>
      </div>

      {/* Add form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <FiPlus size={20} />
          Shto shërbim
        </h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row sm:items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Emri</label>
            <input
              type="text"
              value={addForm.name}
              onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
              maxLength={NAME_MAX + 1}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
              placeholder="p.sh. Kontrolle + Analiza"
            />
            <p className="text-xs text-slate-500 mt-0.5">{addForm.name.length}/{NAME_MAX}</p>
          </div>
          <div className="w-full sm:w-32">
            <label className="block text-sm font-medium text-slate-700 mb-1">Çmimi</label>
            <input
              type="number"
              step="0.01"
              min={PRICE_MIN}
              value={addForm.price}
              onChange={(e) => setAddForm((p) => ({ ...p, price: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
              placeholder="0"
            />
          </div>
          <button
            type="submit"
            disabled={addSubmitting}
            className="px-5 py-2.5 bg-[#81a2c5] text-white font-medium rounded-lg hover:bg-[#6b8fa8] disabled:opacity-50 transition-colors"
          >
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

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin h-10 w-10 border-2 border-[#81a2c5] border-t-transparent rounded-full mb-3" />
            <p className="text-slate-500 text-sm">Duke ngarkuar…</p>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-16 px-6">
            <FiPackage className="text-slate-300 mx-auto mb-4" size={48} />
            <p className="text-slate-600 font-medium">Nuk ka shërbime ende</p>
            <p className="text-slate-500 text-sm mt-1">Shtoni një shërbim më sipër.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Emri
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Çmimi
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Data
                  </th>
                  <th className="w-28 text-right py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Veprime
                  </th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => {
                  const id = s.id ?? s.Id;
                  const name = s.name ?? s.Name ?? "—";
                  const price = s.price ?? s.Price;
                  const createdAt = s.createdAt ?? s.CreatedAt;
                  return (
                    <tr key={id} className="border-b border-slate-100 hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-medium text-slate-900">{name}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {typeof price === "number" ? price.toFixed(2) : price}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500">{formatDate(createdAt)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(s)}
                            className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            title="Ndrysho"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Fshi"
                          >
                            <FiTrash2 size={18} />
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

      {/* Edit modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !editSubmitting && setEditingId(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Ndrysho shërbimin</h2>
              <button
                type="button"
                onClick={() => !editSubmitting && setEditingId(null)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Emri</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  maxLength={NAME_MAX + 1}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-0.5">{editForm.name.length}/{NAME_MAX}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Çmimi</label>
                <input
                  type="number"
                  step="0.01"
                  min={PRICE_MIN}
                  value={editForm.price}
                  onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#81a2c5] focus:border-transparent"
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
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Anulo
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 bg-[#81a2c5] text-white rounded-lg hover:bg-[#6b8fa8] disabled:opacity-50"
                >
                  {editSubmitting ? "Duke ruajtur…" : "Ruaj"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !deleteSubmitting && setDeleteConfirmId(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <p className="text-slate-700 mb-4">
              A jeni të sigurt që dëshironi ta fshini këtë shërbim? Nuk do të shfaqet më në listë.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => !deleteSubmitting && setDeleteConfirmId(null)}
                disabled={deleteSubmitting}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Anulo
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
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
