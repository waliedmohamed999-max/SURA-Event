"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface AppRow {
  id: string;
  applicationNumber: string;
  status: string;
  submittedAt: string;
  applicant: { fullName: string; companyName: string | null };
  shop: { shopNumber: string; category: { nameEn: string; nameAr: string } };
  assignedEmployee: { name: string } | null;
}

const STATUSES = ["new", "under_review", "documents_required", "approved", "rejected", "cancelled", "rented"];

export default function AdminApplicationsPage() {
  const t = useTranslations("admin.applications");
  const [rows, setRows] = useState<AppRow[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const url = new URL("/api/admin/applications", window.location.origin);
    if (status) url.searchParams.set("status", status);
    if (search) url.searchParams.set("search", search);
    url.searchParams.set("page", String(page));

    fetch(url, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setRows(data.applications ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [status, search, page]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">{t("title")}</h1>

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder={t("searchPlaceholder")}
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none"
        >
          <option value="">{t("allStatuses")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-start text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 text-start">{t("columnNumber")}</th>
              <th className="px-4 py-3 text-start">{t("columnApplicant")}</th>
              <th className="px-4 py-3 text-start">{t("columnShop")}</th>
              <th className="px-4 py-3 text-start">{t("columnStatus")}</th>
              <th className="px-4 py-3 text-start">{t("columnAssigned")}</th>
              <th className="px-4 py-3 text-start">{t("columnDate")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0 hover:bg-background">
                <td className="px-4 py-3">
                  <Link href={`/admin/applications/${row.id}`} className="font-semibold text-accent" dir="ltr">
                    {row.applicationNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div>{row.applicant.fullName}</div>
                  {row.applicant.companyName && <div className="text-xs text-muted">{row.applicant.companyName}</div>}
                </td>
                <td className="px-4 py-3">{row.shop.shopNumber}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-background px-2 py-1 text-xs font-medium">
                    {t(`status.${row.status}`)}
                  </span>
                </td>
                <td className="px-4 py-3">{row.assignedEmployee?.name ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted">
                  {new Date(row.submittedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">
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
