"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TaskDetailCard } from "@/components/task-detail-card"

interface Editor {
  id: string
  full_name: string
  email: string
  phone: string | null
}

interface Task {
  id: string
  client_name: string | null
  client_phone: string | null
  editor_phone: string | null
  content_type: string | null
  content_quantity: number
  billed_amount: number
  editor_payment: number
  net_profit: number
  charged_by: string | null
  paid_by: string | null
  payment_received: boolean
  payment_made: boolean
  status: string
  created_at: string
  due_date: string | null
}

export function EditorColumn({ editor, tasks }: { editor: Editor; tasks: Task[] }) {
  const pendingTasks = tasks.filter((t) => t.status === "pending")
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress")
  const completedTasks = tasks.filter((t) => t.status === "completed")

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="bg-muted/50">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{editor.full_name}</span>
          <Badge variant="outline">{tasks.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
        {pendingTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground px-2">PENDIENTES</p>
            {pendingTasks.map((task) => (
              <TaskDetailCard key={task.id} task={task} editorId={editor.id} />
            ))}
          </div>
        )}

        {inProgressTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground px-2">EN PROGRESO</p>
            {inProgressTasks.map((task) => (
              <TaskDetailCard key={task.id} task={task} editorId={editor.id} />
            ))}
          </div>
        )}

        {completedTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground px-2">COMPLETADAS</p>
            {completedTasks.map((task) => (
              <TaskDetailCard key={task.id} task={task} editorId={editor.id} />
            ))}
          </div>
        )}

        {tasks.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Sin tareas asignadas</p>}
      </CardContent>
    </Card>
  )
}
