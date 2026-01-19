"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { Check, ChevronDown, ChevronUp, Clock, Calendar, X } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Task {
  id: string
  client_name: string | null
  client_phone: string | null
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
  due_date: string | null
}

export function TaskDetailCard({ task, editorId }: { task: Task; editorId: string }) {
  const [expanded, setExpanded] = useState(false)
  const [localTask, setLocalTask] = useState(task)
  const isAdmin = typeof window !== "undefined" && localStorage.getItem("userRole") === "admin"

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    in_progress: "bg-blue-500/10 text-blue-600 border-blue-200",
    completed: "bg-green-500/10 text-green-600 border-green-200",
  }

  const statusBorderColors: Record<string, string> = {
    pending: "border-l-yellow-500",
    in_progress: "border-l-blue-500",
    completed: "border-l-green-500",
  }

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    in_progress: "En Progreso",
    completed: "Completado",
  }

  const handleStatusChange = async (newStatus: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id)

    if (!error) {
      setLocalTask({ ...localTask, status: newStatus })
    }
  }

  const togglePaymentReceived = async () => {
    const supabase = createClient()
    const { error } = await supabase
      .from("tasks")
      .update({ payment_received: !localTask.payment_received })
      .eq("id", task.id)

    if (!error) {
      setLocalTask({ ...localTask, payment_received: !localTask.payment_received })
    }
  }

  const togglePaymentMade = async () => {
    const supabase = createClient()
    const { error } = await supabase.from("tasks").update({ payment_made: !localTask.payment_made }).eq("id", task.id)

    if (!error) {
      setLocalTask({ ...localTask, payment_made: !localTask.payment_made })
    }
  }

  return (
    <Card className={`border shadow-sm hover:shadow-md transition-shadow ${statusBorderColors[localTask.status]} border-l-4`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-sm truncate text-foreground/90">
            {localTask.client_name || "Sin cliente"}
          </p>
          <Badge variant="outline" className={`text-[10px] h-5 px-1.5 font-normal ${statusColors[localTask.status]}`}>
            {statusLabels[localTask.status]}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">
              {localTask.content_quantity} {localTask.content_type || "items"}
            </span>
          </div>
          {localTask.due_date && (
            <div className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-full">
              <Calendar className="h-3 w-3" />
              <span>
                {format(new Date(localTask.due_date), "d MMM", { locale: es })}
              </span>
            </div>
          )}
        </div>

        {isAdmin && expanded && (
          <div className="space-y-2 mb-3 bg-muted/30 p-2 rounded-md text-xs">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Facturado:</span>
                <span className="font-medium">${localTask.billed_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pago:</span>
                <span className="font-medium">${localTask.editor_payment.toFixed(2)}</span>
              </div>
              <div className="flex justify-between col-span-2 border-t pt-1 mt-1">
                <span className="text-muted-foreground font-medium">Ganancia:</span>
                <span className="font-bold text-green-600">${localTask.net_profit.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                variant={localTask.payment_received ? "default" : "outline"}
                size="sm"
                className="h-6 text-[10px] w-full"
                onClick={togglePaymentReceived}
              >
                {localTask.payment_received ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                Cobrado
              </Button>
              <Button
                variant={localTask.payment_made ? "default" : "outline"}
                size="sm"
                className="h-6 text-[10px] w-full"
                onClick={togglePaymentMade}
              >
                {localTask.payment_made ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                Pagado
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50 mt-2">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 ${localTask.status === 'pending' ? 'text-yellow-600 bg-yellow-50' : 'text-muted-foreground hover:text-yellow-600'}`}
              onClick={() => handleStatusChange("pending")}
              title="Pendiente"
            >
              <Clock className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 ${localTask.status === 'in_progress' ? 'text-blue-600 bg-blue-50' : 'text-muted-foreground hover:text-blue-600'}`}
              onClick={() => handleStatusChange("in_progress")}
              title="En Progreso"
            >
              <div className="h-3.5 w-3.5 border-2 border-current rounded-full border-t-transparent animate-spin-slow" style={{ animationDuration: '3s' }} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 ${localTask.status === 'completed' ? 'text-green-600 bg-green-50' : 'text-muted-foreground hover:text-green-600'}`}
              onClick={() => handleStatusChange("completed")}
              title="Completada"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Menos" : "Info"}
            {expanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
