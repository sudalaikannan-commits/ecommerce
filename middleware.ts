import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/jwt";

const ADMIN_LOGIN = "/admin/login";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect the admin area (pages and API). The JWT is verified and the
  // role claim is decoded here; the API routes additionally verify the role
  // against the database (a blocked/deleted admin loses access server-side).
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = req.cookies.get(AUTH_COOKIE)?.value;
    const session = token ? await verifySessionToken(token) : null;

    if (!session || session.role !== "ADMIN") {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = ADMIN_LOGIN;
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Admins who are signed in don't need to see the login page again.
  if (pathname.startsWith("/admin/login")) {
    const token = req.cookies.get(AUTH_COOKIE)?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (session && session.role === "ADMIN") {
      const dashboard = req.nextUrl.clone();
      dashboard.pathname = "/admin";
      return NextResponse.redirect(dashboard);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};