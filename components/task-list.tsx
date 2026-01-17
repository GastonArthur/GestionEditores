"use client"

import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

interface Task {
  id: string
  title: string
  description: string
  status: string
  video_count: number
  payment_amount: number
  editor_id: string | null
  users: { full_name: string; email: string } | null
}

interface Editor {
  id: string
  full_name: string
  email: string
}

export function TaskList({ tasks, editors, projectId }: { tasks: Task[]; editors: Editor[]; projectId: string }) {
  const [localTasks, setLocalTasks] = useState(tasks)

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    in_progress: "bg-blue-500",
    completed: "bg-green-500",
  }

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    in_progress: "En Progreso",
    completed: "Completado",
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const supabase = createClient()
    const updateData: any = { status: newStatus }

    if (newStatus === "completed") {
      updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase.from("tasks").update(updateData).eq("id", taskId)

    if (!error) {
      setLocalTasks(localTasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
    }
  }

  const handleEditorChange = async (taskId: string, editorId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("tasks").update({ editor_id: editorId }).eq("id", taskId)

    if (!error) {
      const editor = editors.find((e) => e.id === editorId)
      setLocalTasks(
        localTasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                editor_id: editorId,
                users: editor ? { full_name: editor.full_name, email: editor.email } : null,
              }
            : task,
        ),
      )
    }
  }

  if (!localTasks.length) {
    return <p className="text-center text-muted-foreground py-8">No hay tareas para este proyecto</p>
  }

  return (
    <div className="space-y-3">
      {localTasks.map((task) => (
        <div key={task.id} className="flex items-center gap-4 rounded-lg border p-4">
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold">{task.title}</h3>
            <p className="text-sm text-muted-foreground">{task.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <span>Videos: {task.video_count}</span>
              <span>Pago: ${Number(task.payment_amount).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={task.editor_id || ""} onValueChange={(value) => handleEditorChange(task.id, value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Asignar editor" />
              </SelectTrigger>
              <SelectContent>
                {editors.map((editor) => (
                  <SelectItem key={editor.id} value={editor.id}>
                    {editor.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={task.status} onValueChange={(value) => handleStatusChange(task.id, value)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
              </SelectContent>
            </Select>

            <Badge className={statusColors[task.status]}>{statusLabels[task.status]}</Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
