import { withAuth } from "next-auth/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Middleware will protect routes and redirect based on role.
 * Routes to protect:
 *  - /admin/**
 *  - /kasir/**
 */

export default withAuth(
  async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;

    // Public routes (allow)
    if (pathname.startsWith('/_next') || pathname.startsWith('/api/auth') || pathname === '/auth' || pathname.startsWith('/auth')) {
      return NextResponse.next();
    }

    // Get user's role from token
    // @ts-ignore
    const token = req.nextauth?.token;
    const role = token?.role;

    // Protect admin area
    if (pathname.startsWith('/admin')) {
      if (role !== 'admin') {
        const url = req.nextUrl.clone();
        url.pathname = '/auth';
        return NextResponse.redirect(url);
      }
    }

    // Protect kasir area
    if (pathname.startsWith('/kasir')) {
      if (role !== 'kasir') {
        const url = req.nextUrl.clone();
        url.pathname = '/auth';
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token // only allow if token exists
    }
  }
);

export const config = {
  matcher: ['/admin/:path*', '/kasir/:path*', '/auth/:path*', '/api/:path*']
};