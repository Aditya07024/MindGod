import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/dashboard", "/chat", "/mood", "/journal", "/breathing", "/video", "/therapist", "/org-admin", "/super-admin", "/notifications", "/profile", "/crisis", "/setup"];

export function middleware(request: NextRequest) {
  const isProtected = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("mindgod_token");
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/chat/:path*", "/mood/:path*", "/journal/:path*", "/breathing/:path*", "/video/:path*", "/therapist/:path*", "/org-admin/:path*", "/super-admin/:path*", "/notifications/:path*", "/profile/:path*", "/crisis/:path*", "/setup/:path*"]
};
