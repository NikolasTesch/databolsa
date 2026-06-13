import { NextRequest, NextResponse } from 'next/server';

/** Rotas que requerem autenticação */
const PROTECTED_PREFIXES = ['/dashboard', '/assets'];

/** Rotas de auth — redirecionar para /dashboard se já logado */
const AUTH_PREFIXES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;
  const isAuthenticated = Boolean(accessToken);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Executa em todas as rotas exceto estáticos, _next e api/
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
