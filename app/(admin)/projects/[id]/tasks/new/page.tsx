"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"

export default function NewTaskPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params?.id as string
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editors, setEditors] = useState<any[]>([])
  const [projectDefaults, setProjectDefaults] = useState<{ default_editor_price?: number }>({})
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_count: "1",
    payment_amount: "",
    editor_id: "",
    status: "pending",
    due_date: "",
  })

  useEffect(() => {
    const fetchEditors = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "editor")
        .eq("is_active", true)
        .order("full_name")
      if (data) setEditors(data)
    }

    const fetchProjectDefaults = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("projects")
        .select("default_editor_price")
        .eq("id", projectId)
        .single()
      
      if (data) {
        setProjectDefaults({ default_editor_price: data.default_editor_price })
        if (data.default_editor_price) {
            setFormData(prev => ({ 
                ...prev, 
                payment_amount: (Number(prev.video_count) * data.default_editor_price).toFixed(2) 
            }))
        }
      }
    }

    fetchEditors()
    fetchProjectDefaults()
  }, [projectId])

  useEffect(() => {
    if (projectDefaults.default_editor_price) {
        const amount = Number(formData.video_count) * projectDefaults.default_editor_price
        setFormData(prev => ({ ...prev, payment_amount: amount.toFixed(2) }))
    }
  }, [formData.video_count, projectDefaults.default_editor_price])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: insertError } = await supabase.from("tasks").insert({
        title: formData.title,
        description: formData.description,
        status: formData.status,
        project_id: projectId,
        editor_id: formData.editor_id || null,
        content_quantity: Number(formData.video_count),
        editor_payment: Number(formData.payment_amount),
        due_date: formData.due_date || null,
      })

      if (insertError) {
        setError(insertError.message)
        setIsLoading(false)
        return
      }

      router.push(`/projects/${projectId}`)
      router.refresh()
    } catch (err) {
      console.error(err)
      setError("Ocurrió un error inesperado")
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Nueva Tarea</h1>
        <p className="text-muted-foreground">Crea una nueva tarea para el proyecto</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información de la Tarea</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="video_count">Cantidad de Videos</Label>
                <Input
                  id="video_count"
                  type="number"
                  min="1"
                  required
                  value={formData.video_count}
                  onChange={(e) => setFormData({ ...formData, video_count: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_amount">Monto a Pagar</Label>
                <Input
                  id="payment_amount"
                  type="number"
                  step="0.01"
                  required
                  value={formData.payment_amount}
                  onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="due_date">Fecha de Finalización</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
               <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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

            <div className="space-y-2">
                <Label htmlFor="editor">Asignar Editor</Label>
                <Select
                  value={formData.editor_id}
                  onValueChange={(value) => setFormData({ ...formData, editor_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar editor" />
                  </SelectTrigger>
                  <SelectContent>
                    {editors.map((editor) => (
                      <SelectItem key={editor.id} value={editor.id}>
                        {editor.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creando..." : "Crear Tarea"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
