import type { AdminRole } from "@/generated/prisma/enums";

export type Permission =
  | "dashboard:read"
  | "applications:read"
  | "applications:write"
  | "shops:read"
  | "shops:write"
  | "map:edit"
  | "categories:read"
  | "categories:write"
  | "reports:read"
  | "audit:read"
  | "users:read"
  | "users:write";

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
    "dashboard:read",
    "applications:read",
    "applications:write",
    "shops:read",
    "shops:write",
    "map:edit",
    "categories:read",
    "categories:write",
    "reports:read",
    "audit:read",
    "users:read",
    "users:write",
  ],
  manager: [
    "dashboard:read",
    "applications:read",
    "applications:write",
    "shops:read",
    "shops:write",
    "map:edit",
    "categories:read",
    "categories:write",
    "reports:read",
    "audit:read",
  ],
  leasing_officer: ["dashboard:read", "applications:read", "applications:write", "shops:read", "categories:read"],
  viewer: ["dashboard:read", "applications:read", "shops:read", "categories:read", "reports:read", "audit:read"],
};

export function can(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
