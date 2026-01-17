"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { Check, ChevronDown, ChevronUp, Clock, X } from "lucide-react"

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
}

export function TaskDetailCard({ task, editorId }: { task: Task; editorId: string }) {
  const [expanded, setExpanded] = useState(false)
  const [localTask, setLocalTask] = useState(task)
  const isAdmin = typeof window !== "undefined" && localStorage.getItem("userRole") === "admin"

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
    <Card className="border-l-4" style={{ borderLeftColor: statusColors[localTask.status]?.replace("bg-", "#") }}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{localTask.client_name || "Sin cliente"}</p>
            {localTask.client_phone && <p className="text-xs text-muted-foreground">{localTask.client_phone}</p>}
          </div>
          <Badge className={`${statusColors[localTask.status]} text-xs`}>{statusLabels[localTask.status]}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Contenido:</p>
            <p className="font-medium">{localTask.content_type || "N/A"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Cantidad:</p>
            <p className="font-medium">{localTask.content_quantity}</p>
          </div>
        </div>

        {isAdmin && (
          <div className="space-y-1 text-xs bg-muted/50 p-2 rounded">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Facturado:</span>
              <span className="font-semibold">${localTask.billed_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pago editor:</span>
              <span>${localTask.editor_payment.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-1">
              <span className="text-muted-foreground font-semibold">Ganancia neta:</span>
              <span className="font-bold text-green-600">${localTask.net_profit.toFixed(2)}</span>
            </div>
          </div>
        )}

        <Button variant="ghost" size="sm" className="w-full h-6 text-xs" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
          {expanded ? "Menos" : "Más detalles"}
        </Button>

        {expanded && (
          <div className="space-y-2 pt-2 border-t text-xs">
            {isAdmin && (
              <>
                <div>
                  <p className="text-muted-foreground">Cobrado por:</p>
                  <p className="font-medium">{localTask.charged_by || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pagado por:</p>
                  <p className="font-medium">{localTask.paid_by || "N/A"}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant={localTask.payment_received ? "default" : "outline"}
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    onClick={togglePaymentReceived}
                  >
                    {localTask.payment_received ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                    Recibí pago
                  </Button>
                  <Button
                    variant={localTask.payment_made ? "default" : "outline"}
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    onClick={togglePaymentMade}
                  >
                    {localTask.payment_made ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                    Pagué editor
                  </Button>
                </div>
              </>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant={localTask.status === "pending" ? "default" : "outline"}
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={() => handleStatusChange("pending")}
              >
                <Clock className="h-3 w-3 mr-1" />
                Pendiente
              </Button>
              <Button
                variant={localTask.status === "in_progress" ? "default" : "outline"}
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={() => handleStatusChange("in_progress")}
              >
                En Progreso
              </Button>
              <Button
                variant={localTask.status === "completed" ? "default" : "outline"}
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={() => handleStatusChange("completed")}
              >
                <Check className="h-3 w-3 mr-1" />
                Completada
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
