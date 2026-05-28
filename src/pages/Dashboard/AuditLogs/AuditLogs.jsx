import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiActivity } from "react-icons/fi";
import PageHeader from "../../../components/ui/PageHeader";
import { useAuth } from "../../../context/AuthContext";
import { isClinicAdminRole } from "../../../utils/dashboardMenu";
import { getAuditLogs } from "../../../api/auditLogs";
import AuditLogFilters from "../../../components/Dashboard/AuditLogs/AuditLogFilters";
import AuditLogTable from "../../../components/Dashboard/AuditLogs/AuditLogTable";
import AuditLogDetailsModal from "../../../components/Dashboard/AuditLogs/AuditLogDetailsModal";
import { Navigate } from "react-router-dom";

const DEFAULT_FILTERS = {
  search: "",
  action: "",
  entityName: "",
  fromDate: "",
  toDate: "",
};

const DEFAULT_PAGINATION = { page: 1, pageSize: 20, totalCount: 0 };

function toApiParams(filters, page, pageSize) {
  const params = { page, pageSize };
  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.action) params.action = filters.action;
  if (filters.entityName) params.entityName = filters.entityName;
  if (filters.fromDate) params.fromDate = filters.fromDate;
  if (filters.toDate) params.toDate = filters.toDate;
  return params;
}

function mapAuditItem(item, idx) {
  const action = item?.action ?? item?.Action ?? "";
  const entityDisplayName =
    item?.entityDisplayName ?? item?.EntityDisplayName ?? "";
  const entityName = item?.entityName ?? item?.EntityName ?? "";
  const fallbackDescription =
    action && (entityDisplayName || entityName)
      ? `${action} on ${entityDisplayName || entityName}`
      : action || "—";

  return {
    id: item?.id ?? item?.Id ?? `row-${idx}`,
    clinicId: item?.clinicId ?? item?.ClinicId ?? null,
    userId: item?.userId ?? item?.UserId ?? "",
    userDisplayName:
      item?.userDisplayName ??
      item?.UserDisplayName ??
      item?.userFullName ??
      item?.UserFullName ??
      "",
    userRole: item?.userRole ?? item?.UserRole ?? "",
    action,
    description:
      item?.description ?? item?.Description ?? fallbackDescription,
    status: item?.status ?? item?.Status ?? "Success",
    severity: item?.severity ?? item?.Severity ?? "Info",
    entityDisplayName: entityDisplayName || "",
    entityReference:
      item?.entityReference ?? item?.EntityReference ?? "",
    entityName,
    entityId: item?.entityId ?? item?.EntityId ?? "",
    ipAddress: item?.ipAddress ?? item?.IpAddress ?? "",
    userAgent: item?.userAgent ?? item?.UserAgent ?? "",
    createdAtUtc: item?.createdAtUtc ?? item?.CreatedAtUtc ?? item?.createdAt ?? item?.CreatedAt ?? "",
    metadata: item?.metadata ?? item?.Metadata ?? null,
  };
}

function buildSummary(items, totalCount) {
  const byAction = (name) => items.filter((x) => x.action === name).length;
  return {
    totalLogs: totalCount,
    patientAccessEvents:
      byAction("PatientViewed") + byAction("MedicalRecordViewed"),
    dataChanges:
      byAction("PatientCreated") +
      byAction("PatientUpdated") +
      byAction("PatientDeleted") +
      byAction("MedicalRecordUpdated"),
    exportsOrAnonymizations:
      byAction("PatientExported") + byAction("PatientAnonymized"),
  };
}

export default function AuditLogs() {
  const { role } = useAuth();
  const roleLower = String(role || "").toLowerCase();
  const isAllowed = isClinicAdminRole(roleLower);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [selectedLog, setSelectedLog] = useState(null);

  const loadAuditLogs = useCallback(async (filters, page, pageSize) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await getAuditLogs(toApiParams(filters, page, pageSize));
      const list = Array.isArray(data?.items) ? data.items : [];
      setItems(list.map(mapAuditItem));
      setPagination({
        page: Number(data?.page) || page,
        pageSize: Number(data?.pageSize) || pageSize,
        totalCount:
          Number(data?.totalCount) ||
          Number(data?.total) ||
          Number(data?.TotalCount) ||
          Number(data?.Total) ||
          0,
      });
    } catch (err) {
      setItems([]);
      setErrorMessage(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Could not load audit logs. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditLogs(appliedFilters, pagination.page, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDraftChange = (key, value) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const nextPage = 1;
    setAppliedFilters(draftFilters);
    setPagination((prev) => ({ ...prev, page: nextPage }));
    loadAuditLogs(draftFilters, nextPage, pagination.pageSize);
  };

  const clearFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadAuditLogs(DEFAULT_FILTERS, 1, pagination.pageSize);
  };

  const onPrev = () => {
    if (pagination.page <= 1) return;
    const nextPage = pagination.page - 1;
    setPagination((prev) => ({ ...prev, page: nextPage }));
    loadAuditLogs(appliedFilters, nextPage, pagination.pageSize);
  };

  const onNext = () => {
    const shown = pagination.page * pagination.pageSize;
    if (shown >= pagination.totalCount) return;
    const nextPage = pagination.page + 1;
    setPagination((prev) => ({ ...prev, page: nextPage }));
    loadAuditLogs(appliedFilters, nextPage, pagination.pageSize);
  };

  const summary = useMemo(
    () => buildSummary(items, pagination.totalCount),
    [items, pagination.totalCount]
  );

  if (!isAllowed) return <Navigate to="/dashboard" replace />;

  return (
    <div className="page-shell">
      <PageHeader
        title="Audit Logs"
        subtitle="Track sensitive activity and patient data access inside your clinic."
        icon={FiActivity}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-sm text-slate-500">Total Logs</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{summary.totalLogs}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Patient Access Events</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{summary.patientAccessEvents}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Data Changes</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{summary.dataChanges}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Exports / Anonymizations</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{summary.exportsOrAnonymizations}</p>
        </div>
      </div>

      <AuditLogFilters
        draftFilters={draftFilters}
        onDraftChange={handleDraftChange}
        onApply={applyFilters}
        onClear={clearFilters}
        loading={loading}
      />

      <AuditLogTable
        items={items}
        loading={loading}
        errorMessage={errorMessage}
        onDetails={setSelectedLog}
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalCount={pagination.totalCount}
        onPrev={onPrev}
        onNext={onNext}
      />

      <AuditLogDetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
