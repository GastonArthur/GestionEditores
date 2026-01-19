
"use client"

import { ShortsTask } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Clock, FileText, ExternalLink, ThumbsUp, ThumbsDown } from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

interface ShortsTasksListProps {
  tasks: ShortsTask[]
  planId: string
  isAdmin?: boolean
}

export function ShortsTasksList({ tasks, planId, isAdmin }: ShortsTasksListProps) {
  
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    in_progress: "bg-blue-500",
    done: "bg-green-500",
    rejected: "bg-red-500",
  }

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    in_progress: "En Progreso",
    done: "Completado",
    rejected: "Rechazado",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tareas de la Semana</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${
                    task.status === 'done' ? 'bg-green-100 dark:bg-green-900/30' : 
                    task.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30' :
                    'bg-muted'
                }`}>
                   {task.status === 'done' ? <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" /> : 
                    task.status === 'rejected' ? <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" /> :
                    <Clock className="h-5 w-5 text-muted-foreground" />
                   }
                </div>
                <div>
                   <h4 className="font-semibold">{task.title}</h4>
                   <p className="text-sm text-muted-foreground capitalize">
                     {format(parseISO(task.due_date), "EEEE d 'de' MMMM", { locale: es })}
                   </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 self-end md:self-auto">
                 {task.proof_url && (
                    <a href={task.proof_url} target="_blank" rel="noopener noreferrer">
                       <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ver
                       </Button>
                    </a>
                 )}
                 <Badge className={`${statusColors[task.status]} hover:${statusColors[task.status]}`}>
                    {statusLabels[task.status]}
                 </Badge>
                 
                 {isAdmin && task.status === 'done' && (
                    <div className="flex gap-1 ml-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" title="Aprobar (Quality Check)">
                            <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" title="Rechazar">
                            <ThumbsDown className="h-4 w-4" />
                        </Button>
                    </div>
                 )}
              </div>
            </div>
          ))}
          
          {tasks.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
               <p className="text-muted-foreground">No hay tareas generadas para este período.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
