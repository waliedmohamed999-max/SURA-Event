"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface CustomerRow {
  applicationId: string;
  applicationNumber: string;
  fullName: string;
  companyName: string | null;
  email: string;
  mobile: string;
  crNumber: string | null;
  nationalAddress: string | null;
  shopNumber: string;
  submittedAt: string;
  missingDocumentCount: number;
}

export default function AdminCustomersPage() {
  const t = useTranslations("admin.customers");
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    const url = new URL("/api/admin/customers", window.location.origin);
    if (search) url.searchParams.set("search", search);
    url.searchParams.set("page", String(page));

    fetch(url, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setRows(data.customers ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") throw err;
      });

    return () => controller.abort();
  }, [search, page]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">{t("title")}</h1>

      <input
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
        placeholder={t("searchPlaceholder")}
        className="w-full max-w-sm rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
      />

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 text-start">{t("columnName")}</th>
              <th className="px-4 py-3 text-start">{t("columnCompany")}</th>
              <th className="px-4 py-3 text-start">{t("columnContact")}</th>
              <th className="px-4 py-3 text-start">{t("columnCr")}</th>
              <th className="px-4 py-3 text-start">{t("columnShop")}</th>
              <th className="px-4 py-3 text-start">{t("columnDocuments")}</th>
              <th className="px-4 py-3 text-start">{t("columnDate")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.applicationId} className="border-b border-border last:border-0 hover:bg-background">
                <td className="px-4 py-3">
                  <Link href={`/admin/applications/${c.applicationId}`} className="font-semibold text-accent">
                    {c.fullName}
                  </Link>
                </td>
                <td className="px-4 py-3">{c.companyName ?? "—"}</td>
                <td className="px-4 py-3 text-xs">
                  <div dir="ltr">{c.email}</div>
                  <div dir="ltr" className="text-muted">
                    {c.mobile}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs" dir="ltr">
                  {c.crNumber ?? "—"}
                </td>
                <td className="px-4 py-3">{c.shopNumber}</td>
                <td className="px-4 py-3">
                  {c.missingDocumentCount === 0 ? (
                    <span className="text-green-600">{t("documentsComplete")}</span>
                  ) : (
                    <span className="text-red-600">{t("documentsIncomplete", { count: c.missingDocumentCount })}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted">{new Date(c.submittedAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted">
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
