"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { logActivity, getAuthUser } from "@/lib/auth"
import type { Profile, ActivityLog, ProjectTemplate } from "@/lib/types"
import { EDITOR_SECTIONS } from "@/lib/types"
import { Clock, User } from "lucide-react"

export default function SettingsPage() {
  const [editors, setEditors] = useState<Profile[]>([])
  const [userSections, setUserSections] = useState<Record<string, string[]>>({})
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [templates, setTemplates] = useState<ProjectTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()

    const [{ data: editorsData }, { data: sectionsData }, { data: logsData }, { data: templatesData }] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("role", "editor").eq("is_active", true),
        supabase.from("user_sections").select("*"),
        supabase
          .from("activity_logs")
          .select("*, user:profiles(full_name)")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase.from("project_templates").select("*").eq("is_active", true),
      ])

    setEditors(editorsData || [])
    setTemplates(templatesData || [])
    setLogs(logsData || [])

    // Organizar secciones por usuario
    const sections: Record<string, string[]> = {}
    sectionsData?.forEach((s) => {
      if (!sections[s.user_id]) sections[s.user_id] = []
      if (s.is_visible) sections[s.user_id].push(s.section_key)
    })
    setUserSections(sections)

    setLoading(false)
  }

  const toggleSection = async (userId: string, sectionKey: string, isVisible: boolean) => {
    const supabase = createClient()
    const user = getAuthUser()

    // Upsert la sección
    await supabase
      .from("user_sections")
      .upsert(
        { user_id: userId, section_key: sectionKey, is_visible: isVisible },
        { onConflict: "user_id,section_key" },
      )

    // Actualizar estado local
    setUserSections((prev) => {
      const userSects = prev[userId] || []
      if (isVisible) {
        return { ...prev, [userId]: [...userSects, sectionKey] }
      } else {
        return { ...prev, [userId]: userSects.filter((s) => s !== sectionKey) }
      }
    })

    await logActivity(user?.id || null, "update_sections", "user", userId, undefined, {
      section: sectionKey,
      visible: isVisible,
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const actionLabels: Record<string, string> = {
    login: "Inició sesión",
    logout: "Cerró sesión",
    create: "Creó",
    update: "Actualizó",
    delete: "Eliminó",
    update_sections: "Cambió permisos",
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Permisos, plantillas y logs del sistema</p>
      </div>

      <Tabs defaultValue="permissions">
        <TabsList>
          <TabsTrigger value="permissions">Permisos</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
          <TabsTrigger value="logs">Logs de Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Secciones por Editor</CardTitle>
              <CardDescription>Controla qué secciones puede ver cada editor</CardDescription>
            </CardHeader>
            <CardContent>
              {editors.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No hay editores registrados</p>
              ) : (
                <div className="space-y-6">
                  {editors.map((editor) => (
                    <div key={editor.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{editor.full_name}</span>
                        <Badge variant="outline">{editor.username}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-6">
                        {EDITOR_SECTIONS.map((section) => (
                          <div key={section.key} className="flex items-center gap-2">
                            <Switch
                              id={`${editor.id}-${section.key}`}
                              checked={userSections[editor.id]?.includes(section.key) ?? true}
                              onCheckedChange={(checked) => toggleSection(editor.id, section.key, checked)}
                            />
                            <Label htmlFor={`${editor.id}-${section.key}`} className="text-sm">
                              {section.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Plantillas de Proyecto</CardTitle>
              <CardDescription>Plantillas disponibles para crear proyectos rápidamente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline">{template.default_content_type}</Badge>
                        <Badge variant="secondary">{template.default_content_quantity} unidades</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Actividad</CardTitle>
              <CardDescription>Últimas 100 acciones en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {(log.user as unknown as { full_name: string })?.full_name || "Sistema"}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {actionLabels[log.action] || log.action}
                          </Badge>
                          {log.entity_type && (
                            <Badge variant="secondary" className="text-xs">
                              {log.entity_type}
                            </Badge>
                          )}
                        </div>
                        {log.entity_name && <p className="text-sm text-muted-foreground truncate">{log.entity_name}</p>}
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(log.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
