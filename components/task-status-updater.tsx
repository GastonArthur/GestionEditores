"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface TaskStatusUpdaterProps {
  taskId: string
  currentStatus: string
}

export function TaskStatusUpdater({ taskId, currentStatus }: TaskStatusUpdaterProps) {
  const [status, setStatus] = useState(currentStatus)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleUpdate = async () => {
    if (status === currentStatus) return

    setIsLoading(true)
    try {
      const supabase = createClient()

      const updateData: Record<string, unknown> = { status }
      if (status === "completed") {
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await supabase.from("tasks").update(updateData).eq("id", taskId)

      if (error) {
        console.error("Error updating task status:", error)
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error("Unexpected error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pendiente</SelectItem>
          <SelectItem value="in_progress">En Proceso</SelectItem>
          <SelectItem value="completed">Completada</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleUpdate} disabled={isLoading || status === currentStatus} size="sm">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar"}
      </Button>
    </div>
  )
}
