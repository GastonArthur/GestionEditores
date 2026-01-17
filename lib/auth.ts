import { createClient } from "@/lib/supabase/client"

export interface AuthUser {
  id: string
  username: string
  full_name: string
  role: "admin" | "editor"
}

export async function loginWithUsername(
  username: string,
  password: string,
): Promise<{ user: AuthUser | null; error: string | null }> {
  const supabase = createClient()

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, password_hash, full_name, role, is_active")
    .eq("username", username)
    .single()

  if (error || !profile) {
    return { user: null, error: "Usuario no encontrado" }
  }

  if (!profile.is_active) {
    return { user: null, error: "Usuario desactivado" }
  }

  // Verificación simple de contraseña (en producción usar bcrypt)
  if (profile.password_hash !== password) {
    return { user: null, error: "Contraseña incorrecta" }
  }

  const user: AuthUser = {
    id: profile.id,
    username: profile.username,
    full_name: profile.full_name,
    role: profile.role,
  }

  // Guardar en localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_user", JSON.stringify(user))
  }

  // Registrar log de login
  try {
    await logActivity(profile.id, "login", "user", profile.id, profile.username)
  } catch (error) {
    console.error("Error logging activity:", error)
    // No bloqueamos el login si falla el log
  }

  return { user, error: null }
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem("auth_user")
  return stored ? JSON.parse(stored) : null
}

export function logout() {
  if (typeof window !== "undefined") {
    const user = getAuthUser()
    if (user) {
      logActivity(user.id, "logout", "user", user.id, user.username)
    }
    localStorage.removeItem("auth_user")
  }
}

export async function logActivity(
  userId: string | null,
  action: string,
  entityType: string,
  entityId?: string,
  entityName?: string,
  details?: Record<string, unknown>,
) {
  const supabase = createClient()
  await supabase.from("activity_logs").insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    details,
  })
}
