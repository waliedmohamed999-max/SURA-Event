"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface NotificationRow {
  id: string;
  type: string;
  channel: string;
  recipient: string;
  subject: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

const STATUS_STYLE: Record<string, string> = {
  sent: "text-green-600",
  logged_only: "text-amber-600",
  failed: "text-red-600",
};

export default function AdminNotificationsPage() {
  const t = useTranslations("admin.notifications");
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetch(`/api/admin/notifications?page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(data.notifications ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
      });
  }, [page]);

  const smtpHint = rows.some((r) => r.status === "logged_only");

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">{t("title")}</h1>

      {smtpHint && (
        <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700">{t("smtpHint")}</p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 text-start">{t("columnType")}</th>
              <th className="px-4 py-3 text-start">{t("columnRecipient")}</th>
              <th className="px-4 py-3 text-start">{t("columnSubject")}</th>
              <th className="px-4 py-3 text-start">{t("columnStatus")}</th>
              <th className="px-4 py-3 text-start">{t("columnDate")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((n) => (
              <tr key={n.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-xs">{n.type}</td>
                <td className="px-4 py-3 text-xs" dir="ltr">
                  {n.recipient}
                </td>
                <td className="px-4 py-3">{n.subject}</td>
                <td className="px-4 py-3">
                  <span className={STATUS_STYLE[n.status] ?? ""}>{t(`status.${n.status}`)}</span>
                  {n.errorMessage && n.status === "failed" && (
                    <span className="block text-xs text-muted">{n.errorMessage}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted">{new Date(n.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
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
