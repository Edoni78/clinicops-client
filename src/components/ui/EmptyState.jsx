import React from "react";

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={24} aria-hidden />
        </div>
      )}
      {title && <p className="text-slate-800 font-medium text-sm">{title}</p>}
      {description && <p className="text-slate-500 text-sm mt-1 max-w-md leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
