"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatsCard } from "@/components/stats-card"
import { Badge } from "@/components/ui/badge"
import { Clock, FolderKanban, DollarSign, AlertCircle } from "lucide-react"
import Link from "next/link"
import { getAuthUser } from "@/lib/auth"

interface Task {
  id: string
  title: string
  status: string
  priority: string
  due_date: string | null
  project?: { title: string }
  client?: { name: string }
  editor_id?: string
}

interface Project {
  id: string
  title: string
  status: string
  editor_payment: number | null
  payment_made: boolean
  client?: { name: string }
  editor_id?: string
}

export default function EditorDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const user = getAuthUser()
      if (!user) return

      const supabase = createClient()

      // Obtener datos del editor
      const [{ data: tasksData }, { data: projectsData }] = await Promise.all([
        supabase
          .from("tasks")
          .select("*, project:projects(title), client:clients(name)")
          .eq("editor_id", user.id)
          .order("due_date", { ascending: true }),
        supabase.from("projects").select("*, client:clients(name)").eq("editor_id", user.id),
      ])

      setTasks((tasksData as any) || [])
      setProjects((projectsData as any) || [])
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

  // Calcular estadísticas
  const pendingTasks = tasks.filter((t) => t.status !== "completada").length || 0
  const activeProjects = projects.filter((p) => p.status !== "cerrado").length || 0
  const pendingPayment =
    projects.filter((p) => !p.payment_made).reduce((sum, p) => sum + Number(p.editor_payment || 0), 0) || 0
  const totalPaid =
    projects.filter((p) => p.payment_made).reduce((sum, p) => sum + Number(p.editor_payment || 0), 0) || 0

  // Tareas ordenadas por prioridad y fecha
  const priorityOrder = { urgente: 0, alta: 1, media: 2, baja: 3 }
  const sortedTasks =
    tasks
      .filter((t) => t.status !== "completada")
      .sort((a, b) => {
        const priorityDiff =
          (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) -
          (priorityOrder[b.priority as keyof typeof priorityOrder] || 2)
        if (priorityDiff !== 0) return priorityDiff
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      }) || []

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgente":
        return "bg-red-500 text-white"
      case "alta":
        return "bg-orange-500 text-white"
      case "media":
        return "bg-yellow-500 text-black"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completada":
        return "bg-green-500 text-white"
      case "en_proceso":
        return "bg-blue-500 text-white"
      default:
        return "bg-gray-400 text-white"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mi Dashboard</h1>
        <p className="text-muted-foreground">Resumen de tu trabajo y pagos</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Tareas Pendientes" value={pendingTasks} icon={Clock} description="Por completar" />
        <StatsCard title="Proyectos Activos" value={activeProjects} icon={FolderKanban} description="En proceso" />
        <StatsCard
          title="Por Cobrar"
          value={`$${pendingPayment.toLocaleString()}`}
          icon={AlertCircle}
          description="Pagos pendientes"
        />
        <StatsCard
          title="Total Cobrado"
          value={`$${totalPaid.toLocaleString()}`}
          icon={DollarSign}
          description="Pagos recibidos"
        />
      </div>

      {/* Mis Tareas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mis Tareas</CardTitle>
          <Link href="/editor/tasks" className="text-sm text-primary hover:underline">
            Ver todas
          </Link>
        </CardHeader>
        <CardContent>
          {sortedTasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No tienes tareas pendientes</p>
          ) : (
            <div className="space-y-3">
              {sortedTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{task.title}</span>
                      <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      <Badge className={getStatusColor(task.status)}>{task.status.replace("_", " ")}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {task.project?.title && <span>Proyecto: {task.project.title}</span>}
                      {task.client?.name && <span> | Cliente: {task.client.name}</span>}
                    </div>
                  </div>
                  {task.due_date && (
                    <div className="text-sm text-muted-foreground">
                      Vence: {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mis Proyectos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mis Proyectos</CardTitle>
          <Link href="/editor/projects" className="text-sm text-primary hover:underline">
            Ver todos
          </Link>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No tienes proyectos asignados</p>
          ) : (
            <div className="space-y-3">
              {projects
                .filter((p) => p.status !== "cerrado")
                .slice(0, 5)
                .map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{project.title}</span>
                        <Badge variant={project.status === "entregado" ? "default" : "secondary"}>
                          {project.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Cliente: {project.client?.name || "Sin cliente"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${Number(project.editor_payment || 0).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {project.payment_made ? (
                          <span className="text-green-600">Pagado</span>
                        ) : (
                          <span className="text-orange-600">Pendiente</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
