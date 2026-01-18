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
  payment_received: boolean
  payment_made: boolean
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
      <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3 border-b bg-muted/10">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-bold leading-tight">{task.title}</CardTitle>
              {task.project?.title && (
                <p className="text-sm text-muted-foreground mt-1 font-medium">
                  {task.project.title}
                </p>
              )}
            </div>
            <Badge className={`${getPriorityColor(task.priority)} shrink-0`}>{task.priority}</Badge>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 space-y-5 pt-4">
          {/* Status del pago - New Section */}
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-background border rounded-md p-2 text-center shadow-sm">
               <span className="text-xs text-muted-foreground block uppercase tracking-wider mb-1">Cobrado</span>
               <span className={`text-sm font-bold ${task.payment_received ? "text-green-600" : "text-amber-600"}`}>
                 {task.payment_received ? "SÍ" : "NO"}
               </span>
             </div>
             <div className="bg-background border rounded-md p-2 text-center shadow-sm">
               <span className="text-xs text-muted-foreground block uppercase tracking-wider mb-1">Pagado</span>
               <span className={`text-sm font-bold ${task.payment_made ? "text-green-600" : "text-amber-600"}`}>
                 {task.payment_made ? "SÍ" : "NO"}
               </span>
             </div>
          </div>

          {/* Descripción Box */}
          <div className="bg-muted/30 rounded-lg p-3 border border-muted">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Trabajo a realizar</Label>
            <p className="text-sm leading-relaxed text-foreground/90 min-h-[60px]">
              {task.description || "Sin descripción"}
            </p>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
             {task.due_date && (
               <div className="flex items-center gap-1">
                 <span className="font-medium">Vence:</span> 
                 <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-100">
                   {new Date(task.due_date).toLocaleDateString()}
                 </span>
               </div>
             )}
          </div>

          {/* Notas Box */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mis Notas</Label>
            <div className="relative">
              <Textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Escribe tus notas aquí..."
                className="min-h-[80px] text-sm resize-none pr-10 bg-background"
              />
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={saveNotes} 
                disabled={savingNotes}
                className="absolute bottom-2 right-2 h-6 w-6 hover:bg-muted"
              >
                {savingNotes ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </CardContent>
        
        <div className="p-4 pt-0 mt-auto">
           <TaskStatusUpdater taskId={task.id} currentStatus={task.status} />
        </div>
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
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
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
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
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
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
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
