"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NewTaskPage() {
  const router = useRouter()
  const [editors, setEditors] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    editor_id: "",
    client_id: "",
    content_type: "",
    content_quantity: 1,
    billed_amount: 0,
    editor_payment: 0,
    billed_by: "",
    paid_by: "",
    payment_received: false,
    payment_made: false,
    status: "pending",
  })

  useEffect(() => {
    loadEditors()
    loadClients()
  }, [])

  useEffect(() => {
    // Calcular ganancia neta automáticamente
    const netProfit = formData.billed_amount - formData.editor_payment
    setFormData((prev) => ({ ...prev, net_profit: netProfit }))
  }, [formData.billed_amount, formData.editor_payment])

  const loadEditors = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("profiles").select("*").eq("role", "editor").order("full_name")
    if (data) setEditors(data)
  }

  const loadClients = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("clients").select("*").order("name")
    if (data) setClients(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const netProfit = formData.billed_amount - formData.editor_payment

    const { error } = await supabase.from("tasks").insert([
      {
        ...formData,
        net_profit: netProfit,
      },
    ])

    setLoading(false)

    if (!error) {
      router.push("/tasks")
    }
  }

  return (
    <div className="space-y-6 p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nueva Tarea</h1>
          <p className="text-muted-foreground">Crea una nueva tarea para un editor</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información de la Tarea</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="editor">Editor Asignado *</Label>
              <Select
                value={formData.editor_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, editor_id: value })
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un editor" />
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

            <div>
              <Label htmlFor="client">Cliente *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, client_id: value })
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="content_type">Tipo de Contenido *</Label>
                <Input
                  id="content_type"
                  placeholder="Ej: Video corto, Reel, etc."
                  value={formData.content_type}
                  onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="content_quantity">Cantidad *</Label>
                <Input
                  id="content_quantity"
                  type="number"
                  min="1"
                  value={formData.content_quantity}
                  onChange={(e) => setFormData({ ...formData, content_quantity: Number.parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billed_amount">Facturado (cobro al cliente) *</Label>
                <Input
                  id="billed_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.billed_amount}
                  onChange={(e) => setFormData({ ...formData, billed_amount: Number.parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editor_payment">Pago a Editor *</Label>
                <Input
                  id="editor_payment"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.editor_payment}
                  onChange={(e) => setFormData({ ...formData, editor_payment: Number.parseFloat(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-muted-foreground">Ganancia Neta</p>
              <p className="text-2xl font-bold text-green-600">
                ${(formData.billed_amount - formData.editor_payment).toFixed(2)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billed_by">Cobrado Por</Label>
                <Input
                  id="billed_by"
                  placeholder="Método de cobro"
                  value={formData.billed_by}
                  onChange={(e) => setFormData({ ...formData, billed_by: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="paid_by">Pagado Por</Label>
                <Input
                  id="paid_by"
                  placeholder="Método de pago"
                  value={formData.paid_by}
                  onChange={(e) => setFormData({ ...formData, paid_by: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="payment_received"
                  checked={formData.payment_received}
                  onCheckedChange={(checked) => setFormData({ ...formData, payment_received: checked as boolean })}
                />
                <Label htmlFor="payment_received" className="cursor-pointer">
                  ¿Recibí el pago del cliente?
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="payment_made"
                  checked={formData.payment_made}
                  onCheckedChange={(checked) => setFormData({ ...formData, payment_made: checked as boolean })}
                />
                <Label htmlFor="payment_made" className="cursor-pointer">
                  ¿Pagué al editor?
                </Label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Link href="/tasks" className="flex-1">
                <Button type="button" variant="outline" className="w-full bg-transparent">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Creando..." : "Crear Tarea"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
