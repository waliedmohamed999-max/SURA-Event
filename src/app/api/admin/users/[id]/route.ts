import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["super_admin", "manager", "leasing_officer", "viewer"]).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin("users:write");
  if ("response" in guard) return guard.response;
  const { user: actor } = guard;

  const { id } = await params;
  if (id === actor.id) {
    return NextResponse.json({ error: "You cannot change your own account here." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const user = await prisma.adminUser.update({
    where: { id },
    data: parsed.data,
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });
  return NextResponse.json({ user });
}
