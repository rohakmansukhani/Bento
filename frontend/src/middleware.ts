
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Create an unmodified Supabase client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: You *must* call getUser to validate the session securely
    const {
        data: { user },
    } = await supabase.auth.getUser()

    console.log("Middleware Debug:", {
        path: request.nextUrl.pathname,
        hasUser: !!user,
        cookies: request.cookies.getAll().map(c => c.name)
    });

    // 1. If trying to access /dashboard and NOT logged in -> Redirect to /login
    if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 2. If trying to access /login or / (Landing) and ALREADY logged in -> Redirect to /dashboard
    if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/') && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/login',
        '/auth/:path*',
        // Exclude static assets
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
