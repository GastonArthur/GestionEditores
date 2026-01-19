"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon, Pencil, CheckCircle2, Clock, PlayCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

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

interface TaskCardProps {
  task: Task
  editors: Editor[]
  onUpdate: () => void
}

export function TaskCard({ task, editors, onUpdate }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || "",
    video_count: task.video_count?.toString() || "1",
    payment_amount: task.payment_amount?.toString() || "0",
    editor_id: task.editor_id || "unassigned",
    status: task.status,
    due_date: task.due_date || "",
  })

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
    in_progress: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
    completed: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
  }

  const statusIcons = {
    pending: Clock,
    in_progress: PlayCircle,
    completed: CheckCircle2,
  }

  const StatusIcon = statusIcons[task.status as keyof typeof statusIcons] || Clock

  const handleStatusChange = async (newStatus: string) => {
    const supabase = createClient()
    const updateData: any = { status: newStatus }
    if (newStatus === "completed") {
      updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase.from("tasks").update(updateData).eq("id", task.id)
    if (error) {
      toast.error("Error al actualizar estado")
    } else {
      toast.success("Estado actualizado")
      onUpdate()
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    const supabase = createClient()
    
    const { error } = await supabase.from("tasks").update({
      title: formData.title,
      description: formData.description,
      content_quantity: Number(formData.video_count),
      editor_payment: Number(formData.payment_amount),
      editor_id: formData.editor_id === "unassigned" ? null : formData.editor_id,
      status: formData.status,
      due_date: formData.due_date || null,
    }).eq("id", task.id)

    setIsSaving(false)

    if (error) {
      toast.error("Error al guardar: " + error.message)
    } else {
      toast.success("Tarea actualizada")
      setIsEditing(false)
      onUpdate()
    }
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2">
            <div>
              <CardTitle className="text-base font-semibold leading-none mb-1">
                {task.title}
              </CardTitle>
              {task.due_date && (
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <CalendarIcon className="mr-1 h-3 w-3" />
                  {format(new Date(task.due_date), "dd/MM/yyyy")}
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-2 text-sm space-y-2">
          <p className="text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {task.description || "Sin descripción"}
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <Badge variant="outline">
              {task.video_count} {Number(task.video_count) === 1 ? "Video" : "Videos"}
            </Badge>
            <Badge variant="outline" className="text-green-600 border-green-200">
              ${Number(task.payment_amount).toFixed(2)}
            </Badge>
          </div>
          <div className="pt-2">
             <div className="text-xs text-muted-foreground mb-1">Editor Asignado</div>
             <div className="font-medium flex items-center gap-2">
                {task.users ? (
                    <span className="bg-secondary px-2 py-1 rounded text-xs">{task.users.full_name}</span>
                ) : (
                    <span className="text-muted-foreground italic text-xs">Sin asignar</span>
                )}
             </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2 flex justify-between items-center border-t bg-muted/20">
            <Select value={task.status} onValueChange={handleStatusChange}>
                <SelectTrigger className={cn("h-8 w-full border-0 bg-transparent shadow-none font-medium", 
                    task.status === 'pending' && "text-yellow-700",
                    task.status === 'in_progress' && "text-blue-700",
                    task.status === 'completed' && "text-green-700",
                )}>
                    <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" />
                        <SelectValue />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="pending" className="text-yellow-700">
                        <div className="flex items-center gap-2"><Clock className="h-4 w-4"/> Pendiente</div>
                    </SelectItem>
                    <SelectItem value="in_progress" className="text-blue-700">
                        <div className="flex items-center gap-2"><PlayCircle className="h-4 w-4"/> En Progreso</div>
                    </SelectItem>
                    <SelectItem value="completed" className="text-green-700">
                        <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4"/> Completado</div>
                    </SelectItem>
                </SelectContent>
            </Select>
        </CardFooter>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarea</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Videos</Label>
                    <Input 
                        type="number" 
                        value={formData.video_count} 
                        onChange={(e) => setFormData({...formData, video_count: e.target.value})} 
                    />
                </div>
                <div className="space-y-2">
                    <Label>Pago ($)</Label>
                    <Input 
                        type="number" 
                        value={formData.payment_amount} 
                        onChange={(e) => setFormData({...formData, payment_amount: e.target.value})} 
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Editor</Label>
                    <Select 
                        value={formData.editor_id} 
                        onValueChange={(v) => setFormData({...formData, editor_id: v})}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unassigned">Sin asignar</SelectItem>
                            {editors.map(e => (
                                <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Fecha de Entrega</Label>
                    <Input 
                        type="date" 
                        value={formData.due_date} 
                        onChange={(e) => setFormData({...formData, due_date: e.target.value})} 
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Estado</Label>
                <Select 
                    value={formData.status} 
                    onValueChange={(v) => setFormData({...formData, status: v})}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="in_progress">En Progreso</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
