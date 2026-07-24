import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only run middleware on /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // Allow the login page itself to be accessed without auth
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Check for the secure admin session cookie
    const adminSession = request.cookies.get('admin_session');

    if (!adminSession || adminSession.value !== 'authenticated') {
      // If no valid session, instantly bounce to the login page
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Configure the middleware to only match /admin routes to keep performance high
export const config = {
  matcher: ['/admin/:path*'],
};
