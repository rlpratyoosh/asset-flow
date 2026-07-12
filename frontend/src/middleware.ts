import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// As requested, using array variables and logic but keeping elements empty for now,
// except for the core auth logic the user explicitly requested ("only non-logins can join").
const protectedRoutes: string[] = [];
const publicRoutes: string[] = ['/'];
const authRoutes: string[] = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some((route) => pathname === route);

  // If it's not explicitly protected or auth, we can let it pass,
  // or apply logic based on further requirements.

  // Get the tokens from cookies
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  let isAuthenticated = false;

  // We can verify auth by calling the backend /me endpoint directly from the Edge runtime
  if (accessToken || refreshToken) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const res = await fetch(`${backendUrl}/api/v1/me`, {
        headers: {
          Cookie: request.cookies.toString(),
        },
      });
      
      if (res.ok) {
        isAuthenticated = true;
      }
    } catch (error) {
      console.error('Middleware fetch error:', error);
    }
  }

  // Logic: only non-logins can join (access auth routes like /login, /register)
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Logic: unauthenticated users cannot access protected routes
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
