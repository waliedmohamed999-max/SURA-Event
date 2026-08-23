import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie, verifyPassword } from "@/lib/admin-auth";
import { isRateLimited } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`admin-login:${ip}`, 10, 5 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const user = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
  const genericError = NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  if (!user || !user.isActive) {
    return genericError;
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    return genericError;
  }

  const { token, expiresAt } = await createSession(user.id);

  const response = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
  setSessionCookie(response, token, expiresAt);
  return response;
}
