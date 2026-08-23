"use client";

import { useCallback, useEffect, useState, use } from "react";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { REQUIRED_DOCUMENT_TYPES } from "@/lib/validation";

interface ApplicationDetail {
  id: string;
  applicationNumber: string;
  status: string;
  businessActivity: string;
  brandCategory: string | null;
  yearsInBusiness: number | null;
  website: string | null;
  instagram: string | null;
  crNumber: string | null;
  nationalAddress: string | null;
  ownerMobile: string | null;
  preferredRentalPeriod: string | null;
  staffCount: number | null;
  additionalRequirements: string | null;
  internalNotes: string | null;
  submittedAt: string;
  applicant: { fullName: string; companyName: string | null; email: string; mobile: string; country: string; city: string };
  shop: { shopNumber: string; status: string; category: { nameEn: string } };
  documents: { id: string; type: string; fileName: string }[];
  assignedEmployee: { id: string; name: string } | null;
  auditLogs: { id: string; action: string; previousValue: string | null; newValue: string | null; createdAt: string; actor: { name: string } | null }[];
}

const ACTIONS = [
  { action: "start_review", visibleFor: ["new"] },
  { action: "request_documents", visibleFor: ["new", "under_review"] },
  { action: "approve", visibleFor: ["new", "under_review", "documents_required"] },
  { action: "reject", visibleFor: ["new", "under_review", "documents_required"] },
  { action: "cancel", visibleFor: ["new", "under_review", "documents_required"] },
  { action: "mark_rented", visibleFor: ["approved"] },
  { action: "release", visibleFor: ["approved", "rented"] },
] as const;

export default function AdminApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("admin.applications");
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/admin/applications/${id}`)
      .then((r) => r.json())
      .then((data) => setApp(data.application));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction(action: string) {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: notes || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setActionError(data?.error ?? "Action failed.");
        return;
      }
      setNotes("");
      load();
    } finally {
      setBusy(false);
    }
  }

  if (!app) return <p className="text-sm text-muted">{t("loading")}</p>;

  const presentDocTypes = new Set(app.documents.map((d) => d.type));
  const missingDocTypes = REQUIRED_DOCUMENT_TYPES.filter((type) => !presentDocTypes.has(type));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold" dir="ltr">
            {app.applicationNumber}
          </h1>
          <p className="text-sm text-muted">
            {t("shopLabel")} {app.shop.shopNumber} — {app.shop.category.nameEn}
          </p>
        </div>
        <span className="rounded-full bg-background px-3 py-1.5 text-xs font-semibold">
          {t(`status.${app.status}`)}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title={t("applicantSection")}>
            <Field label={t("fullName")} value={app.applicant.fullName} />
            <Field label={t("companyName")} value={app.applicant.companyName ?? "—"} />
            <Field label={t("email")} value={app.applicant.email} />
            <Field label={t("mobile")} value={app.applicant.mobile} />
            <Field label={t("country")} value={app.applicant.country} />
            <Field label={t("city")} value={app.applicant.city} />
          </Section>

          <Section title={t("businessSection")}>
            <Field label={t("businessActivity")} value={app.businessActivity} full />
            <Field label={t("brandCategory")} value={app.brandCategory ?? "—"} />
            <Field label={t("yearsInBusiness")} value={app.yearsInBusiness?.toString() ?? "—"} />
            <Field label={t("website")} value={app.website ?? "—"} />
            <Field label={t("instagram")} value={app.instagram ?? "—"} />
            <Field label={t("crNumber")} value={app.crNumber ?? "—"} />
            <Field label={t("ownerMobile")} value={app.ownerMobile ?? "—"} />
            <Field label={t("nationalAddress")} value={app.nationalAddress ?? "—"} full />
          </Section>

          <Section title={t("requirementsSection")}>
            <Field label={t("preferredRentalPeriod")} value={app.preferredRentalPeriod ?? "—"} />
            <Field label={t("staffCount")} value={app.staffCount?.toString() ?? "—"} />
            <Field label={t("additionalRequirements")} value={app.additionalRequirements ?? "—"} full />
          </Section>

          <Section title={t("documentsSection")}>
            {missingDocTypes.length > 0 && (
              <p className="sm:col-span-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                {t("missingDocumentsWarning", {
                  types: missingDocTypes.map((type) => t(`docType.${type}`)).join(", "),
                })}
              </p>
            )}
            {app.documents.length === 0 && <p className="text-sm text-muted">{t("noDocuments")}</p>}
            <ul className="space-y-2 sm:col-span-2">
              {app.documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between rounded-lg bg-background px-3 py-2 text-sm">
                  <span>
                    {doc.fileName} <span className="text-xs text-muted">({t(`docType.${doc.type}`)})</span>
                  </span>
                  <a
                    href={`/api/admin/documents/${doc.id}/download`}
                    className="flex items-center gap-1 text-xs font-semibold text-accent"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {t("download")}
                  </a>
                </li>
              ))}
            </ul>
          </Section>

          <Section title={t("auditSection")}>
            <ul className="space-y-2 text-xs">
              {app.auditLogs.map((log) => (
                <li key={log.id} className="text-muted">
                  <span className="font-semibold text-foreground">{log.actor?.name ?? "System"}</span> — {log.action}
                  {log.previousValue && log.newValue && (
                    <span>
                      {" "}
                      ({log.previousValue} → {log.newValue})
                    </span>
                  )}
                  <span className="block">{new Date(log.createdAt).toLocaleString()}</span>
                </li>
              ))}
              {app.auditLogs.length === 0 && <li className="text-muted">{t("noAuditLogs")}</li>}
            </ul>
          </Section>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="font-display text-sm font-bold">{t("actionsSection")}</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              rows={3}
              className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
            />
            <div className="mt-3 flex flex-col gap-2">
              {ACTIONS.filter((a) => a.visibleFor.includes(app.status as never)).map((a) => {
                const blockedByDocs = a.action === "approve" && missingDocTypes.length > 0;
                return (
                  <button
                    key={a.action}
                    type="button"
                    disabled={busy || blockedByDocs}
                    title={blockedByDocs ? t("missingDocumentsWarning", { types: missingDocTypes.map((type) => t(`docType.${type}`)).join(", ") }) : undefined}
                    onClick={() => runAction(a.action)}
                    className="rounded-full bg-primary py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {t(`action.${a.action}`)}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={busy || !notes}
                onClick={() => runAction("note")}
                className="rounded-full border border-border py-2 text-xs font-semibold disabled:opacity-50"
              >
                {t("action.note")}
              </button>
            </div>
            {actionError && <p className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">{actionError}</p>}
          </div>

          {app.internalNotes && (
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="font-display text-sm font-bold">{t("internalNotes")}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{app.internalNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="font-display text-sm font-bold">{title}</h3>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
