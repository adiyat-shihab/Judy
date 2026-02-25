import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route access map — which roles can access which path prefixes
const ROLE_ROUTES: Record<string, string[]> = {
  '/dashboard/admin': ['Admin'],
  '/dashboard/buyer': ['Buyer'],
  '/dashboard/solver': ['Problem Solver'],
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('judy_token')?.value;
  const role = request.cookies.get('judy_role')?.value;

  const isDashboard = pathname.startsWith('/dashboard');
  const isAuthPage = pathname === '/login' || pathname === '/register';

  // If trying to access dashboard without being logged in → redirect to login
  if (isDashboard && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If already logged in and hitting auth pages → redirect to their dashboard
  if (isAuthPage && token && role) {
    if (role === 'Admin') return NextResponse.redirect(new URL('/dashboard/admin', request.url));
    if (role === 'Buyer') return NextResponse.redirect(new URL('/dashboard/buyer', request.url));
    return NextResponse.redirect(new URL('/dashboard/solver', request.url));
  }

  // Role-based route enforcement
  if (isDashboard && role) {
    for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
      if (pathname.startsWith(route) && !allowedRoles.includes(role)) {
        // Redirect to their own correct dashboard
        if (role === 'Admin') return NextResponse.redirect(new URL('/dashboard/admin', request.url));
        if (role === 'Buyer') return NextResponse.redirect(new URL('/dashboard/buyer', request.url));
        return NextResponse.redirect(new URL('/dashboard/solver', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
