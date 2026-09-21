import React from "react";
import Drawer from "../../ui/Drawer";

function formatDateTime(dateValue) {
  if (!dateValue) return "—";
  try {
    return new Date(dateValue).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return dateValue;
  }
}

function Row({ label, value }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2 border-b border-slate-100 last:border-b-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="col-span-2 text-sm text-slate-800 break-words">{value || "—"}</span>
    </div>
  );
}

export default function AuditLogDetailsModal({ log, onClose }) {
  if (!log) return null;

  return (
    <Drawer
      open
      onClose={onClose}
      title="Detajet e auditimit"
      subtitle="Qasje, ndryshime dhe ngjarje të të dhënave"
      widthClass="max-w-lg"
    >
      <div className="rounded-md border border-slate-200 bg-white p-3">
        <Row label="User" value={log.userDisplayName || "Unknown user"} />
        <Row label="User Role" value={log.userRole} />
        <Row label="User ID (technical)" value={log.userId} />
        <Row label="Entity Display Name" value={log.entityDisplayName} />
        <Row label="Entity Reference" value={log.entityReference} />
        <Row label="Entity Name" value={log.entityName || "Unknown entity"} />
        <Row label="Entity ID (technical)" value={log.entityId} />
        <Row label="Action" value={log.action} />
        <Row label="Status" value={log.status || "Success"} />
        <Row label="Severity" value={log.severity || "Info"} />
        <Row label="Description" value={log.description} />
        <Row label="IP Address" value={log.ipAddress || "Unknown IP"} />
        <Row label="User Agent" value={log.userAgent} />
        <Row label="Created At" value={formatDateTime(log.createdAtUtc)} />
      </div>

      {log.metadata ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-700 mb-2">Metadata</p>
          <pre className="text-xs bg-slate-50 border border-slate-200 rounded-md p-3 overflow-auto max-h-64 font-mono">
            {typeof log.metadata === "string" ? log.metadata : JSON.stringify(log.metadata, null, 2)}
          </pre>
        </div>
      ) : null}
    </Drawer>
  );
}
