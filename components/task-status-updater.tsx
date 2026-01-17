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
    const supabase = createClient()

    const updateData: Record<string, unknown> = { status }
    if (status === "completada") {
      updateData.completed_at = new Date().toISOString()
    }

    await supabase.from("tasks").update(updateData).eq("id", taskId)

    setIsLoading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pendiente">Pendiente</SelectItem>
          <SelectItem value="en_proceso">En Proceso</SelectItem>
          <SelectItem value="completada">Completada</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleUpdate} disabled={isLoading || status === currentStatus} size="sm">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar"}
      </Button>
    </div>
  )
}
