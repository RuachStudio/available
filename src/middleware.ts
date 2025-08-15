import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ADMIN_COOKIE = "admin_auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page, API routes, and static/_next assets without checks
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/fonts/")
  ) {
    return NextResponse.next();
  }

  // Protect only /admin/* pages (except /admin/login above)
  if (pathname.startsWith("/admin")) {
    const authed = req.cookies.get(ADMIN_COOKIE)?.value === "1";
    if (!authed) {
      const url = new URL("/admin/login", req.url);
      url.searchParams.set("next", pathname); // send them back after login
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Only run on admin pages (and subpaths)
export const config = {
  matcher: ["/admin/:path*"],
};