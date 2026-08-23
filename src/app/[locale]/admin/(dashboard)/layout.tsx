import { redirect } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import type { Locale } from "@/i18n/routing";

export default async function AdminDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getSessionUser();
  if (!user) {
    return redirect({ href: "/admin/login", locale: locale as Locale });
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
