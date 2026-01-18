"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TaskStatusUpdater } from "@/components/task-status-updater"
import { getAuthUser } from "@/lib/auth"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  created_at: string
  notes: string | null
  project?: { title: string }
}

export default function EditorTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = async () => {
    const user = getAuthUser()
    if (!user) return

    const supabase = createClient()
    const { data } = await supabase
      .from("tasks")
      .select("*, project:projects(title)")
      .eq("editor_id", user.id)
      .order("created_at", { ascending: false })

    setTasks((data as any) || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const pendingTasks = tasks.filter((t) => t.status === "pending") || []
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress") || []
  const completedTasks = tasks.filter((t) => t.status === "completed") || []

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgente": return "bg-red-500 text-white"
      case "alta": return "bg-orange-500 text-white"
      case "media": return "bg-yellow-500 text-black"
      default: return "bg-gray-500 text-white"
    }
  }

  const TaskCard = ({ task }: { task: Task }) => {
    const [notes, setNotes] = useState(task.notes || "")
    const [savingNotes, setSavingNotes] = useState(false)

    const saveNotes = async () => {
      setSavingNotes(true)
      const supabase = createClient()
      const { error } = await supabase.from("tasks").update({ notes }).eq("id", task.id)
      if (error) {
        toast.error("Error al guardar notas")
      } else {
        toast.success("Notas guardadas")
      }
      setSavingNotes(false)
    }

    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base">{task.title}</CardTitle>
            <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.description && (
            <div>
              <Label className="text-xs text-muted-foreground">Descripción</Label>
              <p className="text-sm">{task.description}</p>
            </div>
          )}
          
          <div className="text-sm space-y-1">
            {task.project?.title && (
              <div>
                <span className="text-muted-foreground">Proyecto:</span> {task.project.title}
              </div>
            )}
            {task.due_date && (
              <div>
                <span className="text-muted-foreground">Vence:</span> {new Date(task.due_date).toLocaleDateString()}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Mis Notas</Label>
            <div className="flex gap-2">
              <Textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Escribe tus notas aquí..."
                className="min-h-[60px] text-sm"
              />
              <Button size="icon" variant="ghost" onClick={saveNotes} disabled={savingNotes}>
                {savingNotes ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <TaskStatusUpdater taskId={task.id} currentStatus={task.status} />
        </CardContent>
      </Card>
    )
  }

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
