"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const ROLES = ["super_admin", "manager", "leasing_officer", "viewer"];

export default function AdminUsersPage() {
  const t = useTranslations("admin.users");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "viewer" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []));
  }

  useEffect(load, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("genericError"));
        return;
      }
      setForm({ name: "", email: "", password: "", role: "viewer" });
      setShowForm(false);
      load();
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(user: UserRow) {
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
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
          {t("addUser")}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createUser} className="grid gap-3 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2">
          <input
            required
            placeholder={t("name")}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            required
            type="email"
            placeholder={t("email")}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            dir="ltr"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            required
            type="password"
            placeholder={t("password")}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            dir="ltr"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`role.${r}`)}
              </option>
            ))}
          </select>
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
              <th className="px-4 py-3 text-start">{t("name")}</th>
              <th className="px-4 py-3 text-start">{t("email")}</th>
              <th className="px-4 py-3 text-start">{t("roleLabel")}</th>
              <th className="px-4 py-3 text-start">{t("statusLabel")}</th>
              <th className="px-4 py-3 text-start" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3" dir="ltr">
                  {u.email}
                </td>
                <td className="px-4 py-3">{t(`role.${u.role}`)}</td>
                <td className="px-4 py-3">
                  <span className={u.isActive ? "text-green-600" : "text-muted"}>
                    {u.isActive ? t("active") : t("inactive")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleActive(u)}
                    className="text-xs font-semibold text-accent"
                  >
                    {u.isActive ? t("deactivate") : t("activate")}
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
