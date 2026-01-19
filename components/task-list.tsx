"use client"

import { useState, useEffect } from "react"
import { TaskCard } from "@/components/task-card"
import { useRouter } from "next/navigation"

interface Task {
  id: string
  title: string
  description: string
  status: string
  video_count: number
  payment_amount: number
  editor_id: string | null
  due_date: string | null
  users: { full_name: string; email: string } | null
}

interface Editor {
  id: string
  full_name: string
  email: string
}

export function TaskList({ tasks, editors, projectId }: { tasks: Task[]; editors: Editor[]; projectId: string }) {
  const router = useRouter()
  // We keep a local version for immediate updates if needed, but router.refresh() is the source of truth
  const [localTasks, setLocalTasks] = useState(tasks)

  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  const handleUpdate = () => {
    router.refresh()
  }

  if (!localTasks.length) {
    return (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            No hay tareas en este proyecto.
        </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {localTasks.map((task) => (
        <TaskCard 
            key={task.id} 
            task={task} 
            editors={editors} 
            onUpdate={handleUpdate} 
        />
      ))}
    </div>
  )
}
