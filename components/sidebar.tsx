"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Video,
  ChevronDown,
  FolderKanban,
  CheckSquare,
  Users,
  DollarSign,
  Settings,
  Inbox,
  UserCircle,
  BarChart3
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useState } from "react"

interface SidebarProps {
  role: "admin" | "editor"
  userName?: string
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname()
  const [openSections, setOpenSections] = useState<string[]>(["general", "management", "finance", "work"])

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const adminSections = [
    {
      key: "general",
      label: "General",
      items: [
        { href: "/dashboard", label: "Panel Principal", icon: LayoutDashboard, exact: true },
        { href: "/inbox", label: "Bandeja de Entrada", icon: Inbox },
      ]
    },
    {
      key: "management",
      label: "Gestión",
      items: [
        { href: "/projects", label: "Proyectos", icon: FolderKanban },
        { href: "/tasks", label: "Tareas", icon: CheckSquare },
        { href: "/clients", label: "Clientes", icon: Users },
        { href: "/editors", label: "Editores", icon: UserCircle },
      ]
    },
    {
      key: "finance",
      label: "Finanzas",
      items: [
        { href: "/accounting", label: "Contabilidad", icon: DollarSign },
      ]
    },
    {
      key: "settings",
      label: "Configuración",
      items: [
        { href: "/settings", label: "Ajustes", icon: Settings },
      ]
    }
  ]

  const editorSections = [
    {
      key: "work",
      label: "Tareas",
      items: [
        { href: "/editor/projects", label: "Mis Proyectos", icon: FolderKanban },
        { href: "/editor/tasks", label: "Mis Tareas", icon: CheckSquare },
      ]
    },
    {
      key: "finance",
      label: "Finanzas",
      items: [
        { href: "/editor/payments", label: "Mis Pagos", icon: DollarSign },
      ]
    }
  ]

  const sections = role === "admin" ? adminSections : editorSections

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Video className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sm">Vantum Agency</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {sections.map((section) => (
          <Collapsible
            key={section.key}
            open={openSections.includes(section.key)}
            onOpenChange={() => toggleSection(section.key)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between text-xs font-medium text-muted-foreground hover:text-foreground mb-1"
              >
                {section.label}
                <ChevronDown className={cn(
                  "h-3 w-3 transition-transform",
                  openSections.includes(section.key) && "rotate-180"
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5">
              {section.items.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive(item.href, item.exact) ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-full justify-start text-sm h-8",
                      isActive(item.href, item.exact) && "bg-secondary font-medium"
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </nav>

      {/* User info */}
      <div className="border-t p-3">
        <div className="px-2 text-xs text-muted-foreground truncate">
          {userName || "Usuario"}
        </div>
        <div className="px-2 text-xs text-muted-foreground/70">
          {role === "admin" ? "Administrador" : "Editor"}
        </div>
      </div>
    </aside>
  )
}
