"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { loginWithUsername } from "@/lib/auth"
import { Video, User, Lock } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    console.log("Attempting login with username:", username)

    try {
      const { user, error: loginError } = await loginWithUsername(username, password)
      console.log("Login result:", { user, error: loginError })

      if (loginError || !user) {
        console.error("Login failed:", loginError)
        setError(loginError || "Error al iniciar sesión")
        setIsLoading(false)
        return
      }

      console.log("Login successful, redirecting...", user.role)
      
      // Use router.push for smoother navigation, but verify localStorage first
      if (localStorage.getItem("auth_user")) {
        router.push(user.role === "admin" ? "/admin" : "/editor")
      } else {
        // Fallback if localStorage failed (unlikely)
        console.error("LocalStorage failed to save user")
        setError("Error al guardar la sesión. Intente nuevamente.")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Login error exception:", err)
      setError("Ocurrió un error inesperado. Por favor, intente nuevamente.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-sm">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Video className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Vantum Agency</CardTitle>
              <CardDescription>Sistema de Gestión de Edición</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Usuario</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="admin"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-4">Usuario: admin | Contraseña: admin</p>
      </div>
    </div>
  )
}
