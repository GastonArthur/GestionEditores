import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from("projects")
    .select(
      `
      *,
      clients (name),
      tasks (count)
    `,
    )
    .order("created_at", { ascending: false })

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    in_progress: "bg-blue-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500",
  }

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    in_progress: "En Progreso",
    completed: "Completado",
    cancelled: "Cancelado",
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proyectos</h1>
          <p className="text-muted-foreground">Gestiona todos tus proyectos de edición</p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <Badge className={statusColors[project.status]}>{statusLabels[project.status]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-2">{project.description || "Sin descripción"}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cliente: {project.clients?.name || "Sin asignar"}</span>
                  <span className="font-semibold">
                    {project.currency === "USD" ? "US$" : "$"}
                    {Number(project.price).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {!projects?.length && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No hay proyectos todavía</p>
              <Link href="/projects/new">
                <Button className="mt-4 bg-transparent" variant="outline">
                  Crear el primero
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
