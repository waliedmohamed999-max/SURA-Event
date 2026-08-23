import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "./admin-auth";
import { can, type Permission } from "./permissions";

/**
 * Every admin API route calls this first. Returns either the authenticated,
 * permitted user or a ready-to-return 401/403 response — the route never
 * has to trust anything the client sends about who it is.
 */
export async function requireAdmin(
  permission: Permission
): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const user = await getSessionUser();
  if (!user) {
    return { response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  if (!can(user.role, permission)) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}
