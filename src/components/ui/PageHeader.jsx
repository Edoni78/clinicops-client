import React from "react";

export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  className = "",
}) {
  return (
    <header className={`page-header ${className}`}>
      <div className="min-w-0 flex-1">
        <h1 className="page-title flex items-center gap-3 flex-wrap">
          {Icon && (
            <span className="icon-chip-lg">
              <Icon size={20} aria-hidden />
            </span>
          )}
          <span>{title}</span>
        </h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
