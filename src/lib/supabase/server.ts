import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Session refresh is handled by middleware. In server component
          // contexts cookies cannot be mutated, so this is intentionally
          // swallowed — the Supabase SSR docs explicitly recommend this pattern.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* no-op in server components */ }
        },
      },
    }
  );
};
