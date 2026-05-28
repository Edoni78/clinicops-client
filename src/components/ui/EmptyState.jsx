import React from "react";

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={28} aria-hidden />
        </div>
      )}
      {title && <p className="text-slate-700 font-medium">{title}</p>}
      {description && <p className="text-slate-500 text-sm mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
