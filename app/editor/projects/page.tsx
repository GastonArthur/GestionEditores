"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAuthUser } from "@/lib/auth"

interface ProjectContent {
  id: string
  content_type: string
  quantity: number
}

interface Project {
  id: string
  title: string
  status: string
  description: string | null
  start_date: string | null
  due_date: string | null
  editor_payment: number | null
  payment_made: boolean
  payment_method: string | null
  client?: { name: string }
  contents?: ProjectContent[]
}

export default function EditorProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const user = getAuthUser()
      if (!user) return

      const supabase = createClient()
      const { data } = await supabase
        .from("projects")
        .select("*, client:clients(name), contents:project_contents(*)")
        .eq("editor_id", user.id)
        .order("created_at", { ascending: false })

      setProjects((data as any) || [])
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      pendiente: "secondary",
      en_proceso: "default",
      entregado: "outline",
      cerrado: "secondary",
    }
    return <Badge variant={variants[status] || "secondary"}>{status.replace("_", " ")}</Badge>
  }

  const contentTypeLabels: Record<string, string> = {
    reels: "Reels",
    youtube: "YouTube",
    tiktok: "TikTok",
    shorts: "Shorts",
    logo_banner: "Logo/Banner",
    guion: "Guión",
    video_corporativo: "Video Corporativo",
    videoclip: "Videoclip",
    otro: "Otro",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mis Proyectos</h1>
        <p className="text-muted-foreground">Proyectos asignados a ti</p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">No tienes proyectos asignados</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{project.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Cliente: {project.client?.name || "N/A"}</p>
                  </div>
                  {getStatusBadge(project.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}

                {/* Contenido */}
                {project.contents && project.contents.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Contenido:</p>
                    <div className="flex flex-wrap gap-2">
                      {project.contents.map((content) => (
                        <Badge key={content.id} variant="outline">
                          {content.quantity}x {contentTypeLabels[content.content_type] || content.content_type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fechas */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {project.start_date && (
                    <div>
                      <span className="text-muted-foreground">Inicio:</span>{" "}
                      {new Date(project.start_date).toLocaleDateString()}
                    </div>
                  )}
                  {project.due_date && (
                    <div>
                      <span className="text-muted-foreground">Entrega:</span>{" "}
                      {new Date(project.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Pago al editor - SIN mostrar facturación */}
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Mi pago:</span>
                    <div className="text-right">
                      <span className="font-semibold">${Number(project.editor_payment || 0).toLocaleString()}</span>
                      <Badge variant={project.payment_made ? "default" : "secondary"} className="ml-2">
                        {project.payment_made ? "Pagado" : "Pendiente"}
                      </Badge>
                    </div>
                  </div>
                  {project.payment_method && (
                    <p className="text-xs text-muted-foreground mt-1">Método: {project.payment_method}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
