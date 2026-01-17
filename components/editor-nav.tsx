"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { CheckSquare, DollarSign, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

export function EditorNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const navItems = [
    { href: "/editor", label: "Mis Tareas", icon: CheckSquare },
    { href: "/editor/payments", label: "Pagos", icon: DollarSign },
  ]

  return (
    <nav className="flex h-screen w-64 flex-col border-r bg-background">
      <div className="border-b p-6">
        <h1 className="text-xl font-bold">Panel Editor</h1>
      </div>
      <div className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button variant={isActive ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </div>
      <div className="border-t p-4">
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </nav>
  )
}
