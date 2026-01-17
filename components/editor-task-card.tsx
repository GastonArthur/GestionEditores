"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

interface Task {
  id: string
  title: string
  description: string
  status: string
  video_count: number
  payment_amount: number
  projects: {
    title: string
    clients: { name: string } | null
  } | null
}

export function EditorTaskCard({ task }: { task: Task }) {
  const [status, setStatus] = useState(task.status)
  const [isLoading, setIsLoading] = useState(false)

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

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true)
    
    try {
      const supabase = createClient()

      const updateData: any = { status: newStatus }

      if (newStatus === "completed") {
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await supabase.from("tasks").update(updateData).eq("id", task.id)

      if (!error) {
        setStatus(newStatus)
      } else {
        console.error("Error updating task:", error)
      }
    } catch (error) {
      console.error("Unexpected error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{task.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Proyecto: {task.projects?.title || "Sin proyecto"}</p>
            {task.projects?.clients && (
              <p className="text-sm text-muted-foreground">Cliente: {task.projects.clients.name}</p>
            )}
          </div>
          <Badge className={statusColors[status]}>{statusLabels[status]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{task.description}</p>
        <div className="flex items-center justify-between text-sm">
          <span>Videos: {task.video_count}</span>
          <span className="font-semibold">Pago: ${Number(task.payment_amount).toFixed(2)}</span>
        </div>
        <div className="flex gap-2">
          {status === "pending" && (
            <Button size="sm" className="w-full" onClick={() => handleStatusChange("in_progress")} disabled={isLoading}>
              Comenzar
            </Button>
          )}
          {status === "in_progress" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => handleStatusChange("pending")}
                disabled={isLoading}
              >
                Pausar
              </Button>
              <Button size="sm" className="w-full" onClick={() => handleStatusChange("completed")} disabled={isLoading}>
                Completar
              </Button>
            </>
          )}
          {status === "completed" && (
            <Button size="sm" variant="secondary" className="w-full" disabled>
              Completada
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
