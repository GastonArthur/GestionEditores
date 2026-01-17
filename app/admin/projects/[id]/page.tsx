import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { TaskList } from "@/components/task-list"

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: project }, { data: tasks }, { data: editors }] = await Promise.all([
    supabase
      .from("projects")
      .select(
        `
      *,
      clients (name, email, phone)
    `,
      )
      .eq("id", id)
      .single(),
    supabase
      .from("tasks")
      .select(
        `
      *,
      users (full_name, email)
    `,
      )
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("users").select("id, full_name, email").eq("role", "editor"),
  ])

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    in_progress: "En Progreso",
    completed: "Completado",
    cancelled: "Cancelado",
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{project?.title}</h1>
          <p className="text-muted-foreground">{project?.description}</p>
        </div>
        <Badge>{statusLabels[project?.status || "pending"]}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">{project?.clients?.name || "Sin asignar"}</p>
            {project?.clients?.email && <p className="text-sm text-muted-foreground">{project.clients.email}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Precio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${Number(project?.price || 0).toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tareas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{tasks?.length || 0}</p>
            <p className="text-sm text-muted-foreground">
              {tasks?.filter((t) => t.status === "completed").length || 0} completadas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tareas</CardTitle>
            <Link href={`/admin/projects/${id}/tasks/new`}>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Tarea
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <TaskList tasks={tasks || []} editors={editors || []} projectId={id} />
        </CardContent>
      </Card>
    </div>
  )
}
