"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createApplicationSchema } from "@/lib/validation";
import type { ShopDTO } from "@/lib/types";
import type { Locale } from "@/i18n/routing";

const formSchema = createApplicationSchema.omit({ shopId: true });
type FormValues = z.input<typeof formSchema>;

const DOCUMENT_SLOTS = [
  "docCommercialRegistration",
  "docBrandProfile",
  "docProductCatalog",
  "docIdentityDocument",
] as const;

const DOCUMENT_TYPE_BY_SLOT: Record<(typeof DOCUMENT_SLOTS)[number], string> = {
  docCommercialRegistration: "commercial_registration",
  docBrandProfile: "brand_profile",
  docProductCatalog: "product_catalog",
  docIdentityDocument: "identity_document",
};

export function ApplicationForm({ shop, locale }: { shop: ShopDTO; locale: Locale }) {
  const t = useTranslations("apply");
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [otherFiles, setOtherFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { agreedToTerms: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, shopId: shop.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.code === "SHOP_UNAVAILABLE" ? t("shopUnavailable") : t("genericError"));
        setSubmitting(false);
        return;
      }

      const applicationId: string = data.application.id;
      const applicationNumber: string = data.application.applicationNumber;

      const uploads: Promise<Response>[] = [];
      for (const slot of DOCUMENT_SLOTS) {
        const file = files[slot];
        if (!file) continue;
        const form = new FormData();
        form.append("file", file);
        form.append("type", DOCUMENT_TYPE_BY_SLOT[slot]);
        uploads.push(fetch(`/api/applications/${applicationId}/documents`, { method: "POST", body: form }));
      }
      for (const file of otherFiles) {
        const form = new FormData();
        form.append("file", file);
        form.append("type", "other");
        uploads.push(fetch(`/api/applications/${applicationId}/documents`, { method: "POST", body: form }));
      }
      await Promise.allSettled(uploads);

      router.push(`/apply/${shop.id}/confirmation?number=${encodeURIComponent(applicationNumber)}`);
    } catch {
      setSubmitError(t("networkError"));
      setSubmitting(false);
    }
  });

  const categoryName = locale === "ar" ? shop.category.nameAr : shop.category.nameEn;

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-bold">{t("selectedShop")}</h2>
        <p className="mt-1 text-sm text-muted">
          {shop.shopNumber} — {categoryName}
          {shop.area ? ` — ${shop.area} m²` : ""}
        </p>
      </section>

      <FormSection title={t("applicantSection")}>
        <Field label={t("fullName")} error={!!errors.fullName} errorText={t("fieldRequired")}>
          <input {...register("fullName")} className={inputClass} />
        </Field>
        <Field label={t("companyName")} error={!!errors.companyName} errorText={t("fieldRequired")}>
          <input {...register("companyName")} className={inputClass} />
        </Field>
        <Field label={t("email")} error={!!errors.email} errorText={t("fieldRequired")}>
          <input type="email" {...register("email")} className={inputClass} />
        </Field>
        <Field label={t("mobile")} error={!!errors.mobile} errorText={t("fieldRequired")}>
          <input {...register("mobile")} className={inputClass} placeholder="+973 ..." />
        </Field>
        <Field label={t("country")} error={!!errors.country} errorText={t("fieldRequired")}>
          <input {...register("country")} className={inputClass} />
        </Field>
        <Field label={t("city")} error={!!errors.city} errorText={t("fieldRequired")}>
          <input {...register("city")} className={inputClass} />
        </Field>
      </FormSection>

      <FormSection title={t("businessSection")}>
        <Field label={t("businessActivity")} error={!!errors.businessActivity} errorText={t("fieldRequired")} full>
          <textarea {...register("businessActivity")} rows={2} className={inputClass} />
        </Field>
        <Field label={t("brandCategory")} error={!!errors.brandCategory} errorText={t("fieldRequired")}>
          <input {...register("brandCategory")} className={inputClass} />
        </Field>
        <Field label={t("yearsInBusiness")} error={!!errors.yearsInBusiness} errorText={t("fieldRequired")}>
          <input type="number" min={0} {...register("yearsInBusiness")} className={inputClass} />
        </Field>
        <Field label={t("website")} error={!!errors.website} errorText={t("fieldRequired")}>
          <input {...register("website")} className={inputClass} placeholder="https://" />
        </Field>
        <Field label={t("instagram")} error={!!errors.instagram} errorText={t("fieldRequired")}>
          <input {...register("instagram")} className={inputClass} placeholder="@brand" />
        </Field>
        <Field label={t("crNumber")} error={!!errors.crNumber} errorText={t("fieldRequired")}>
          <input {...register("crNumber")} className={inputClass} />
        </Field>
      </FormSection>

      <FormSection title={t("requirementsSection")}>
        <Field label={t("preferredRentalPeriod")} error={!!errors.preferredRentalPeriod} errorText={t("fieldRequired")}>
          <input {...register("preferredRentalPeriod")} className={inputClass} placeholder="12 months" />
        </Field>
        <Field label={t("staffCount")} error={!!errors.staffCount} errorText={t("fieldRequired")}>
          <input type="number" min={0} {...register("staffCount")} className={inputClass} />
        </Field>
        <Field label={t("additionalRequirements")} error={!!errors.additionalRequirements} errorText={t("fieldRequired")} full>
          <textarea {...register("additionalRequirements")} rows={3} className={inputClass} />
        </Field>
      </FormSection>

      <FormSection title={t("documentsSection")}>
        <div className="col-span-full grid gap-4 sm:grid-cols-2">
          {DOCUMENT_SLOTS.map((slot) => (
            <div key={slot}>
              <label className="mb-1 block text-sm font-medium">{t(slot)}</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                onChange={(e) => setFiles((f) => ({ ...f, [slot]: e.target.files?.[0] ?? null }))}
                className="block w-full text-sm file:me-3 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground"
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-sm font-medium">{t("docOther")}</label>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={(e) => setOtherFiles(Array.from(e.target.files ?? []))}
              className="block w-full text-sm file:me-3 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground"
            />
          </div>
        </div>
      </FormSection>

      <div className="flex items-start gap-3">
        <input type="checkbox" id="terms" {...register("agreedToTerms")} className="mt-1 h-4 w-4" />
        <label htmlFor="terms" className="text-sm text-muted">
          {t("agreeTerms")}
        </label>
      </div>
      {errors.agreedToTerms && <p className="text-sm text-red-600">{t("fieldRequired")}</p>}

      {submitError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40";

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  errorText,
  full,
  children,
}: {
  label: string;
  error?: boolean;
  errorText?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{errorText}</p>}
    </div>
  );
}
