import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Rutas públicas
  const publicRoutes = ["/login", "/auth/sign-up", "/auth/sign-up-success", "/auth/error", "/auth/reset-password"]
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Si no hay usuario y no es ruta pública, redirigir a login
  if (!user && !isPublicRoute && pathname !== "/") {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // Si hay usuario, verificar permisos por rol
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    const isAdmin = profile?.role === "admin"

    // Si está en login y ya está autenticado, redirigir según rol
    if (pathname === "/login" || pathname === "/") {
      const url = request.nextUrl.clone()
      url.pathname = isAdmin ? "/admin" : "/editor"
      return NextResponse.redirect(url)
    }

    // Proteger rutas de admin
    if (pathname.startsWith("/admin") && !isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = "/editor"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
