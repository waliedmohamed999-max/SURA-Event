"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface LogRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValue: string | null;
  newValue: string | null;
  notes: string | null;
  createdAt: string;
  actor: { name: string } | null;
}

export default function AdminAuditLogsPage() {
  const t = useTranslations("admin.audit");
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetch(`/api/admin/audit-logs?page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
      });
  }, [page]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">{t("title")}</h1>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 text-start">{t("columnActor")}</th>
              <th className="px-4 py-3 text-start">{t("columnAction")}</th>
              <th className="px-4 py-3 text-start">{t("columnChange")}</th>
              <th className="px-4 py-3 text-start">{t("columnDate")}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{log.actor?.name ?? t("system")}</td>
                <td className="px-4 py-3">{log.action}</td>
                <td className="px-4 py-3 text-xs text-muted">
                  {log.previousValue && log.newValue ? `${log.previousValue} → ${log.newValue}` : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-muted">{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted">
                  {t("empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
          >
            {t("prev")}
          </button>
          <span className="text-xs text-muted">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
          >
            {t("next")}
          </button>
        </div>
      )}
    </div>
  );
}
