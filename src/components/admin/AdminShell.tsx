"use client";

import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  FileText,
  Map as MapIcon,
  ScrollText,
  Users,
  LogOut,
  Tag,
  BarChart3,
  Bell,
} from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { can } from "@/lib/permissions";
import type { SessionUser } from "@/lib/admin-auth";

export function AdminShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/admin", label: t("dashboard"), icon: LayoutDashboard, show: can(user.role, "dashboard:read") },
    { href: "/admin/applications", label: t("applications"), icon: FileText, show: can(user.role, "applications:read") },
    { href: "/admin/shops/map", label: t("mapEditor"), icon: MapIcon, show: can(user.role, "shops:read") },
    { href: "/admin/categories", label: t("categories"), icon: Tag, show: can(user.role, "categories:read") },
    { href: "/admin/reports", label: t("reports"), icon: BarChart3, show: can(user.role, "reports:read") },
    { href: "/admin/notifications", label: t("notifications"), icon: Bell, show: can(user.role, "audit:read") },
    { href: "/admin/audit-logs", label: t("auditLogs"), icon: ScrollText, show: can(user.role, "audit:read") },
    { href: "/admin/users", label: t("users"), icon: Users, show: can(user.role, "users:read") },
  ];

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-e border-border bg-surface md:block">
        <div className="p-5">
          <p className="font-display text-lg font-extrabold">
            GVB <span className="text-accent">Admin</span>
          </p>
        </div>
        <nav className="space-y-1 px-3">
          {links
            .filter((l) => l.show)
            .map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + "/");
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-background"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-5 py-3">
          <div>
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-muted">{t(`role.${user.role}`)}</p>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-background"
            >
              <LogOut className="h-3.5 w-3.5" />
              {t("logout")}
            </button>
          </div>
        </header>
        <main className="flex-1 p-5">{children}</main>
      </div>
    </div>
  );
}
