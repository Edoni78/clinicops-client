import React, { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiHelpCircle,
  FiLock,
  FiTrash2,
  FiX,
} from "react-icons/fi";

const VARIANTS = {
  default: {
    icon: FiHelpCircle,
    iconWrap: "bg-clinic-100 text-clinic-700 ring-clinic-200/80",
    confirmBtn: "btn-primary",
  },
  primary: {
    icon: FiLock,
    iconWrap: "bg-slate-800 text-white ring-slate-700/30",
    confirmBtn: "btn-primary",
  },
  danger: {
    icon: FiTrash2,
    iconWrap: "bg-red-100 text-red-700 ring-red-200/80",
    confirmBtn:
      "inline-flex items-center justify-center gap-2 font-medium rounded-lg px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-all",
  },
  warning: {
    icon: FiAlertTriangle,
    iconWrap: "bg-amber-100 text-amber-800 ring-amber-200/80",
    confirmBtn:
      "inline-flex items-center justify-center gap-2 font-medium rounded-lg px-4 py-2 text-sm bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transition-all",
  },
};

export default function ConfirmModal({
  open,
  title = "Konfirmoni",
  message,
  confirmLabel = "Po, vazhdo",
  cancelLabel = "Anulo",
  variant = "default",
  loading = false,
  onConfirm,
  onClose,
}) {
  const v = VARIANTS[variant] || VARIANTS.default;
  const Icon = v.icon;

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !loading) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay z-[60]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose?.();
      }}
    >
      <div className="card w-full max-w-md shadow-card-lg border-slate-200/90 overflow-hidden animate-[landing-scale-in_0.2s_ease-out]">
        <div className="flex items-start gap-4 p-6 sm:p-7">
          <span
            className={`inline-flex shrink-0 items-center justify-center h-12 w-12 rounded-2xl ring-1 ${v.iconWrap}`}
            aria-hidden
          >
            <Icon size={24} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3
              id="confirm-modal-title"
              className="text-lg font-semibold text-slate-900 tracking-tight"
            >
              {title}
            </h3>
            {message && (
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{message}</p>
            )}
          </div>
          <button
            type="button"
            className="btn-ghost btn-sm shrink-0 -mr-1 -mt-1"
            onClick={onClose}
            disabled={loading}
            aria-label="Mbyll"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="flex flex-wrap-reverse sm:flex-row justify-end gap-2 px-6 sm:px-7 py-4 bg-slate-50/80 border-t border-slate-200/80">
          <button
            type="button"
            className="btn-secondary btn-md w-full sm:w-auto"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`${v.confirmBtn} btn-md w-full sm:w-auto`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Duke përpunuar…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Promise-based confirm dialog (replaces window.confirm).
 * @returns {{ confirm: Function, ConfirmDialog: React.ComponentType }}
 */
export function useConfirmModal() {
  const [state, setState] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const confirm = (options) =>
    new Promise((resolve) => {
      setState({
        title: options?.title ?? "Konfirmoni",
        message: options?.message ?? "",
        confirmLabel: options?.confirmLabel ?? "Po, vazhdo",
        cancelLabel: options?.cancelLabel ?? "Anulo",
        variant: options?.variant ?? "default",
        resolve,
      });
    });

  const close = (result) => {
    setState((prev) => {
      prev?.resolve?.(result);
      return null;
    });
    setSubmitting(false);
  };

  const handleConfirm = async () => {
    if (!state) return;
    setSubmitting(true);
    try {
      state.resolve(true);
      setState(null);
    } finally {
      setSubmitting(false);
    }
  };

  function ConfirmDialog() {
    return (
      <ConfirmModal
        open={!!state}
        title={state?.title}
        message={state?.message}
        confirmLabel={state?.confirmLabel}
        cancelLabel={state?.cancelLabel}
        variant={state?.variant}
        loading={submitting}
        onConfirm={handleConfirm}
        onClose={() => close(false)}
      />
    );
  }

  return { confirm, ConfirmDialog };
}
