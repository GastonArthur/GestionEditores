"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Video,
  ChevronDown,
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
  const [openSections, setOpenSections] = useState<string[]>(["general"])

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
        { href: "/admin", label: "Panel Principal", exact: true },
      ]
    }
  ]

  const editorSections = [
    {
      key: "general",
      label: "General",
      items: [
        { href: "/editor", label: "Mi Panel", exact: true },
        { href: "/editor/tasks", label: "Mis Tareas" },
        { href: "/editor/projects", label: "Mis Proyectos" },
        { href: "/editor/payments", label: "Mis Pagos" },
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
                    <LayoutDashboard className="h-3.5 w-3.5 mr-2" />
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
