import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { publicRoutes, privateRoutes } from "@/lib/constants";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = isAuthenticated(request);

  const isPublicRoute = publicRoutes.includes(pathname);
  const isPrivateRoute = privateRoutes.includes(pathname);

  if (authenticated) {
    if (isPublicRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } else {
    if (isPrivateRoute) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};