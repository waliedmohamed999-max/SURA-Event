"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Printer } from "lucide-react";
import { BarChart, DonutChart } from "@/components/admin/Charts";

interface ReportData {
  occupancy: { rate: number; totalShops: number; available: number; rented: number; reserved: number };
  applicationsByStatus: { status: string; count: number }[];
  applicationsByCategory: { category: string; count: number }[];
  categories: { key: string; nameEn: string; nameAr: string; colorHex: string }[];
  revenue: { total: number; shopsWithPricing: number; shopsRentedTotal: number; note: string | null };
  rentalHistory: {
    id: string;
    shopNumber: string;
    tenantName: string;
    companyName: string | null;
    startDate: string | null;
    endDate: string | null;
    status: string;
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  new: "#94a3b8",
  under_review: "#3B82F6",
  documents_required: "#F59E0B",
  approved: "#06B6D4",
  rejected: "#ef4444",
  cancelled: "#6b7280",
  rented: "#991B1B",
};

export default function AdminReportsPage() {
  const t = useTranslations("admin.reports");
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    fetch("/api/admin/reports")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-sm text-muted">{t("loading")}</p>;

  const statusChartData = data.applicationsByStatus.map((s) => ({
    label: s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] ?? "#9CA3AF",
  }));

  const categoryChartData = data.applicationsByCategory.map((c, i) => ({
    label: c.category,
    value: c.count,
    color: data.categories[i % data.categories.length]?.colorHex ?? "#9CA3AF",
  }));

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="font-display text-2xl font-bold">{t("title")}</h1>
        <div className="flex flex-wrap gap-2">
          {/* Plain <a> tags are intentional here: these are file downloads
              (Content-Disposition: attachment) from an API route, not app
              page navigations, so next-intl/next/link's client-side routing
              would be the wrong tool. */}
          {/* eslint-disable @next/next/no-html-link-for-pages */}
          <a href="/api/admin/reports/export?type=applications" className="export-btn">
            <Download className="h-3.5 w-3.5" /> {t("exportApplications")}
          </a>
          <a href="/api/admin/reports/export?type=shops" className="export-btn">
            <Download className="h-3.5 w-3.5" /> {t("exportShops")}
          </a>
          <a href="/api/admin/reports/export?type=rentals" className="export-btn">
            <Download className="h-3.5 w-3.5" /> {t("exportRentals")}
          </a>
          {/* eslint-enable @next/next/no-html-link-for-pages */}
          <button type="button" onClick={() => window.print()} className="export-btn">
            <Printer className="h-3.5 w-3.5" /> {t("printPdf")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label={t("occupancyRate")} value={`${data.occupancy.rate}%`} />
        <StatCard label={t("availableShops")} value={String(data.occupancy.available)} />
        <StatCard label={t("rentedShops")} value={String(data.occupancy.rented)} />
        <StatCard label={t("reservedShops")} value={String(data.occupancy.reserved)} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="font-display text-sm font-bold">{t("revenue")}</h3>
        <p className="mt-2 text-2xl font-extrabold">BHD {data.revenue.total.toLocaleString()}</p>
        <p className="mt-1 text-xs text-muted">
          {t("revenueBasis", { count: data.revenue.shopsWithPricing, total: data.revenue.shopsRentedTotal })}
        </p>
        {data.revenue.note && <p className="mt-1 text-xs text-amber-600">{data.revenue.note}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DonutChart data={statusChartData} title={t("applicationsByStatus")} />
        <BarChart data={categoryChartData} title={t("applicationsByCategory")} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="font-display text-sm font-bold">{t("rentalHistory")}</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted">
              <tr>
                <th className="px-3 py-2 text-start">{t("shop")}</th>
                <th className="px-3 py-2 text-start">{t("tenant")}</th>
                <th className="px-3 py-2 text-start">{t("startDate")}</th>
                <th className="px-3 py-2 text-start">{t("endDate")}</th>
                <th className="px-3 py-2 text-start">{t("statusLabel")}</th>
              </tr>
            </thead>
            <tbody>
              {data.rentalHistory.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">{r.shopNumber}</td>
                  <td className="px-3 py-2">
                    {r.tenantName}
                    {r.companyName && <span className="text-xs text-muted"> ({r.companyName})</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted">{r.startDate?.slice(0, 10) ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-muted">{r.endDate?.slice(0, 10) ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{r.status}</td>
                </tr>
              ))}
              {data.rentalHistory.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-muted">
                    {t("noRentals")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}
