"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { logout, getAuthUser } from "@/lib/auth"
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  DollarSign,
  UserCircle,
  LogOut,
  Video,
  Inbox,
  BarChart3,
  Settings,
} from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  DollarSign,
  UserCircle,
  Inbox,
  BarChart3,
  Settings,
}

interface SidebarProps {
  role: "admin" | "editor"
  userName?: string
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [visibleSections, setVisibleSections] = useState<string[]>([])

  useEffect(() => {
    const loadSections = async () => {
      const user = getAuthUser()
      if (!user) return

      const supabase = createClient()
      const { data } = await supabase
        .from("user_sections")
        .select("section_key")
        .eq("user_id", user.id)
        .eq("is_visible", true)

      if (data) {
        setVisibleSections(data.map((s) => s.section_key))
      } else {
        // Default sections
        setVisibleSections(
          role === "admin"
            ? ["dashboard", "inbox", "projects", "clients", "editors", "payments", "reports", "settings"]
            : ["dashboard", "my_tasks", "my_projects", "my_payments"],
        )
      }
    }
    loadSections()
  }, [role])

  const adminLinks = [
    { href: "/admin", key: "dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/admin/inbox", key: "inbox", label: "Bandeja", icon: "Inbox" },
    { href: "/admin/projects", key: "projects", label: "Proyectos", icon: "FolderKanban" },
    { href: "/admin/clients", key: "clients", label: "Clientes", icon: "Users" },
    { href: "/admin/editors", key: "editors", label: "Editores", icon: "UserCircle" },
    { href: "/admin/payments", key: "payments", label: "Pagos", icon: "DollarSign" },
    { href: "/admin/reports", key: "reports", label: "Reportes", icon: "BarChart3" },
    { href: "/admin/settings", key: "settings", label: "Configuración", icon: "Settings" },
  ]

  const editorLinks = [
    { href: "/editor", key: "dashboard", label: "Mi Panel", icon: "LayoutDashboard" },
    { href: "/editor/tasks", key: "my_tasks", label: "Mis Tareas", icon: "CheckSquare" },
    { href: "/editor/projects", key: "my_projects", label: "Mis Proyectos", icon: "FolderKanban" },
    { href: "/editor/payments", key: "my_payments", label: "Mis Pagos", icon: "DollarSign" },
  ]

  const allLinks = role === "admin" ? adminLinks : editorLinks
  const links = allLinks.filter((link) => visibleSections.includes(link.key))

  const handleLogout = () => {
    logout()
    router.push("/login")
    router.refresh()
  }

  return (
    <TooltipProvider>
      <aside className="flex h-screen w-64 flex-col border-r bg-card">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Video className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">Vantum Agency</span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {links.map((link) => {
            const Icon = iconMap[link.icon] || LayoutDashboard
            const isActive =
              pathname === link.href ||
              (link.href !== "/admin" && link.href !== "/editor" && pathname.startsWith(link.href))
            return (
              <Tooltip key={link.href}>
                <TooltipTrigger asChild>
                  <Link href={link.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn("w-full justify-start gap-3", isActive && "bg-secondary font-medium")}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{link.label}</TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        <div className="border-t p-3">
          <div className="mb-2 px-3 text-sm text-muted-foreground truncate">{userName || "Usuario"}</div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
