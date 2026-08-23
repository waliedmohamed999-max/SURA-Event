"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface CategoryRow {
  id: string;
  key: string;
  nameEn: string;
  nameAr: string;
  colorHex: string;
  displayOrder: number;
  isActive: boolean;
  _count: { shops: number };
}

const emptyForm = { key: "", nameEn: "", nameAr: "", colorHex: "#16A34A", displayOrder: 0 };

export default function AdminCategoriesPage() {
  const t = useTranslations("admin.categories");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories ?? []));
  }

  useEffect(load, []);

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("genericError"));
        return;
      }
      setForm(emptyForm);
      setShowForm(false);
      load();
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(cat: CategoryRow) {
    await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !cat.isActive }),
    });
    load();
  }

  async function move(cat: CategoryRow, direction: -1 | 1) {
    await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayOrder: cat.displayOrder + direction }),
    });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{t("title")}</h1>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
        >
          {t("addCategory")}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createCategory} className="grid gap-3 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2">
          <input
            required
            placeholder={t("key")}
            value={form.key}
            onChange={(e) => setForm((f) => ({ ...f, key: e.target.value.toLowerCase() }))}
            dir="ltr"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="color"
            value={form.colorHex}
            onChange={(e) => setForm((f) => ({ ...f, colorHex: e.target.value }))}
            className="h-10 w-full rounded-lg border border-border bg-background"
          />
          <input
            required
            placeholder={t("nameEn")}
            value={form.nameEn}
            onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            required
            placeholder={t("nameAr")}
            value={form.nameAr}
            onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
            dir="rtl"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="sm:col-span-2 rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {t("create")}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3 text-start">{t("order")}</th>
              <th className="px-4 py-3 text-start">{t("nameEn")}</th>
              <th className="px-4 py-3 text-start">{t("nameAr")}</th>
              <th className="px-4 py-3 text-start">{t("shopCount")}</th>
              <th className="px-4 py-3 text-start">{t("statusLabel")}</th>
              <th className="px-4 py-3 text-start" />
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => move(c, -1)} className="text-muted hover:text-foreground">
                      ▲
                    </button>
                    <button type="button" onClick={() => move(c, 1)} className="text-muted hover:text-foreground">
                      ▼
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="me-2 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ backgroundColor: c.colorHex }} />
                  {c.nameEn}
                </td>
                <td className="px-4 py-3" dir="rtl">
                  {c.nameAr}
                </td>
                <td className="px-4 py-3">{c._count.shops}</td>
                <td className="px-4 py-3">
                  <span className={c.isActive ? "text-green-600" : "text-muted"}>
                    {c.isActive ? t("active") : t("inactive")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => toggleActive(c)} className="text-xs font-semibold text-accent">
                    {c.isActive ? t("deactivate") : t("activate")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
