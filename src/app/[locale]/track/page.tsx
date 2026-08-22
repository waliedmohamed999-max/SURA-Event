"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

const STATUS_STEPS = [
  { key: "new", labelKey: "stepSubmitted" },
  { key: "under_review", labelKey: "stepUnderReview" },
  { key: "documents_required", labelKey: "stepDocumentsRequired" },
  { key: "approved", labelKey: "stepApproved" },
  { key: "rented", labelKey: "stepRented" },
] as const;

interface TrackResult {
  applicationNumber: string;
  status: string;
  submittedAt: string;
  shop: { shopNumber: string; categoryEn: string; categoryAr: string };
}

function TrackForm() {
  const t = useTranslations("track");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [applicationNumber, setApplicationNumber] = useState(searchParams.get("number") ?? "");
  const [contact, setContact] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const url = `/api/track?applicationNumber=${encodeURIComponent(applicationNumber)}&contact=${encodeURIComponent(contact)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        setError(t("notFound"));
        return;
      }
      setResult(data.application);
    } catch {
      setError(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  const activeIndex = result ? STATUS_STEPS.findIndex((s) => s.key === result.status) : -1;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">{t("applicationNumber")}</label>
          <input
            value={applicationNumber}
            onChange={(e) => setApplicationNumber(e.target.value)}
            placeholder="GVB-2026-00001"
            dir="ltr"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t("contact")}</label>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {loading ? t("searching") : t("submit")}
        </button>
      </form>

      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {result && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          <p className="text-xs uppercase tracking-wide text-muted">{result.shop.shopNumber}</p>
          <p className="text-sm font-medium">{locale === "ar" ? result.shop.categoryAr : result.shop.categoryEn}</p>

          <ol className="mt-6 space-y-3">
            {STATUS_STEPS.map((step, i) => (
              <li key={step.key} className="flex items-center gap-3">
                <span
                  className={`h-3 w-3 rounded-full ${
                    i <= activeIndex && activeIndex >= 0 ? "bg-accent" : "bg-border"
                  }`}
                />
                <span className={i === activeIndex ? "font-semibold" : "text-muted"}>{t(step.labelKey)}</span>
              </li>
            ))}
          </ol>
          {activeIndex === -1 && <p className="mt-4 text-sm text-muted">{t("currentStatus", { status: result.status })}</p>}
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-4 py-14 md:px-8">
        <Suspense>
          <TrackForm />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
