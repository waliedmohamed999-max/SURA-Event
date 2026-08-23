import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clearSessionCookie, destroySessionByToken, SESSION_COOKIE_NAME } from "@/lib/admin-auth";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await destroySessionByToken(token);
  }
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
