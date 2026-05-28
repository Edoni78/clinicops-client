import React from "react";
import EmptyState from "../../ui/EmptyState";
import LoadingSpinner from "../../ui/LoadingSpinner";
import { FiActivity } from "react-icons/fi";

function formatDateTime(dateValue) {
  if (!dateValue) return "—";
  try {
    return new Date(dateValue).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateValue;
  }
}

function getActionBadgeClass(action) {
  const map = {
    PatientViewed: "bg-blue-100 text-blue-800",
    PatientUpdated: "bg-amber-100 text-amber-800",
    PatientDeleted: "bg-red-100 text-red-800",
    PatientExported: "bg-violet-100 text-violet-800",
    PatientAnonymized: "bg-slate-200 text-slate-800",
    Login: "bg-emerald-100 text-emerald-800",
  };
  return map[action] || "bg-slate-100 text-slate-700";
}

function getSeverityBadgeClass(severity) {
  const key = String(severity || "Info").toLowerCase();
  if (key === "warning") return "bg-amber-100 text-amber-800";
  if (key === "security") return "bg-violet-100 text-violet-800";
  if (key === "critical") return "bg-red-100 text-red-800";
  return "bg-blue-100 text-blue-800";
}

function getStatusBadgeClass(status) {
  const key = String(status || "Success").toLowerCase();
  if (key === "failed") return "bg-red-100 text-red-800";
  return "bg-emerald-100 text-emerald-800";
}

export default function AuditLogTable({
  items,
  loading,
  errorMessage,
  onDetails,
  page,
  pageSize,
  totalCount,
  onPrev,
  onNext,
}) {
  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);
  const hasPrev = page > 1;
  const hasNext = end < totalCount;

  if (loading) {
    return (
      <div className="table-shell p-6">
        <LoadingSpinner className="py-10" label="Loading audit logs..." />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="table-shell p-6">
        <EmptyState
          icon={FiActivity}
          title="Could not load audit logs. Please try again."
          description={errorMessage}
        />
      </div>
    );
  }

  return (
    <div className="table-shell p-4 sm:p-6">
      {items.length === 0 ? (
        <EmptyState
          icon={FiActivity}
          title="No audit logs found for the selected filters."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-head-row">
                  <th className="table-th">Date / Time</th>
                  <th className="table-th">User</th>
                  <th className="table-th">Role</th>
                  <th className="table-th">Action</th>
                  <th className="table-th">Description</th>
                  <th className="table-th">IP Address</th>
                  <th className="table-th">Severity</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {items.map((log) => (
                  <tr
                    key={log.id}
                    className="table-row cursor-pointer"
                    onClick={() => onDetails(log)}
                  >
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-slate-700">
                      {formatDateTime(log.createdAtUtc)}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-700">
                      {log.userDisplayName || "Unknown user"}
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-700">
                      {log.userRole || "—"}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getActionBadgeClass(log.action)}`}
                      >
                        {log.action || "—"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-700 max-w-[320px]">
                      <span className="line-clamp-2" title={log.description || undefined}>
                        {log.description || "—"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-700">{log.ipAddress || "Unknown IP"}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getSeverityBadgeClass(log.severity)}`}
                      >
                        {log.severity || "Info"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(log.status)}`}
                      >
                        {log.status || "Success"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDetails(log);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-sm text-slate-600">
              Showing {start}-{end} of {totalCount}
            </span>
            <div className="flex items-center gap-2">
              <button type="button" className="btn-secondary btn-sm" onClick={onPrev} disabled={!hasPrev}>
                Previous
              </button>
              <button type="button" className="btn-secondary btn-sm" onClick={onNext} disabled={!hasNext}>
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
