import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TaskStatusUpdater } from "@/components/task-status-updater"

export default async function EditorTasksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, project:projects(title), client:clients(name)")
    .eq("editor_id", user.id)
    .order("created_at", { ascending: false })

  const pendingTasks = tasks?.filter((t) => t.status === "pendiente") || []
  const inProgressTasks = tasks?.filter((t) => t.status === "en_proceso") || []
  const completedTasks = tasks?.filter((t) => t.status === "completada") || []

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

  const TaskCard = ({ task }: { task: (typeof tasks)[0] }) => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{task.title}</CardTitle>
          <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
        <div className="text-sm space-y-1">
          {task.project?.title && (
            <div>
              <span className="text-muted-foreground">Proyecto:</span> {task.project.title}
            </div>
          )}
          {task.client?.name && (
            <div>
              <span className="text-muted-foreground">Cliente:</span> {task.client.name}
            </div>
          )}
          {task.due_date && (
            <div>
              <span className="text-muted-foreground">Vence:</span> {new Date(task.due_date).toLocaleDateString()}
            </div>
          )}
        </div>
        <TaskStatusUpdater taskId={task.id} currentStatus={task.status} />
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mis Tareas</h1>
        <p className="text-muted-foreground">Gestiona y actualiza el estado de tus tareas</p>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">Pendientes ({pendingTasks.length})</h2>
          {pendingTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">No tienes tareas pendientes</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">En Proceso ({inProgressTasks.length})</h2>
          {inProgressTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">No tienes tareas en proceso</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inProgressTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Completadas ({completedTasks.length})</h2>
          {completedTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">No tienes tareas completadas</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
