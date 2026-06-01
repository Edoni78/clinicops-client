import React from "react";
import { FiSearch } from "react-icons/fi";

/**
 * Compact filter bar: search + optional status/date presets + optional date picker.
 */
export default function ListFiltersBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Kërko…",
  statusTabs,
  activeStatusTab,
  onStatusTabChange,
  datePresets,
  activeDatePreset,
  onDatePresetChange,
  customDate = "",
  onCustomDateChange,
  resultCount,
  resultLabel = "rezultat",
}) {
  const hasStatus = Array.isArray(statusTabs) && statusTabs.length > 0;
  const hasDate = Array.isArray(datePresets) && datePresets.length > 0;

  return (
    <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/40">
      <div className="input-icon-wrap">
        <FiSearch className="input-icon" size={17} aria-hidden />
        <input
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="input-with-icon bg-white"
        />
      </div>

      {(hasStatus || hasDate) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          {hasStatus && (
            <div className="flex flex-wrap gap-1.5">
              {statusTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => onStatusTabChange(tab.value)}
                  className={activeStatusTab === tab.value ? "tab-active" : "tab-inactive"}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {hasDate && (
            <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
              {datePresets.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onDatePresetChange(opt.value)}
                  className={
                    !customDate && activeDatePreset === opt.value ? "tab-active" : "tab-inactive"
                  }
                >
                  {opt.label}
                </button>
              ))}
              {onCustomDateChange && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => onCustomDateChange(e.target.value)}
                  className="input py-1.5 px-2.5 w-auto text-sm min-w-0"
                  aria-label="Zgjidh datë"
                />
              )}
            </div>
          )}

          {typeof resultCount === "number" && (
            <span className="text-xs text-slate-500 sm:w-full lg:w-auto lg:ml-0">
              {resultCount} {resultLabel}
              {resultCount !== 1 ? "e" : ""}
            </span>
          )}
        </div>
      )}

      {!hasStatus && !hasDate && typeof resultCount === "number" && (
        <p className="text-xs text-slate-500">
          {resultCount} {resultLabel}
          {resultCount !== 1 ? "e" : ""}
        </p>
      )}
    </div>
  );
}
