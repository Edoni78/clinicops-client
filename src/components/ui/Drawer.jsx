import React, { useEffect } from "react";
import { FiX } from "react-icons/fi";

export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  widthClass = "max-w-md",
  labelledBy = "drawer-title",
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <button
        type="button"
        className="drawer-overlay"
        onClick={onClose}
        aria-label="Mbyll"
      />
      <aside
        className={`drawer-panel ${widthClass} animate-[slide-in_0.18s_ease-out]`}
      >
        <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-slate-200 shrink-0">
          <div className="min-w-0">
            {title && (
              <h3 id={labelledBy} className="text-sm font-semibold text-slate-900">
                {title}
              </h3>
            )}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" className="btn-ghost btn-sm shrink-0" onClick={onClose} aria-label="Mbyll">
            <FiX size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-slate-200 px-4 py-3 bg-slate-50">{footer}</div>
        )}
      </aside>
    </div>
  );
}
