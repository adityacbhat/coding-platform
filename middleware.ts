import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isAdmin } from '@/lib/admin';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const protectedPaths = ['/dashboard', '/problems', '/concepts', '/companies', '/interview', '/playcards', '/admin'];
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  // Redirect non-admin users away from /admin/* paths
  if (user && request.nextUrl.pathname.startsWith('/admin') && !isAdmin(user.email)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect signed-in users away from auth pages to dashboard
  const authPaths = ['/signin', '/signup'];
  const isAuthPage = authPaths.includes(request.nextUrl.pathname);

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
