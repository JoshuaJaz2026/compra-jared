import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const tieneAcceso = request.cookies.has('jared_auth_token');
  const esRutaLogin = request.nextUrl.pathname === '/login';

  // Si no tiene acceso y NO está en el login -> Lo pateamos al login
  if (!tieneAcceso && !esRutaLogin) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si TIENE acceso y trata de entrar al login -> Lo mandamos directo a la raíz (Dashboard)
  if (tieneAcceso && esRutaLogin) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // En cualquier otro caso, dejamos que la petición continúe
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};