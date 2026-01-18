"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function NewProjectPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    client_id: "",
    price: "",
    status: "pending",
    currency: "ARS",
    payment_method_in: "",
    payment_method_out: "",
  })

  useEffect(() => {
    const fetchClients = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("clients").select("*").order("name")
      if (data) setClients(data)
    }
    fetchClients()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error: insertError } = await supabase.from("projects").insert({
        title: formData.title,
        description: formData.description,
        client_id: formData.client_id || null,
        status: formData.status,
        price: Number(formData.price),
        created_by: user?.id,
        // The following fields are in the form but likely missing in the DB schema, causing the 400 error.
        // To save them, run scripts/08-add-payment-methods-to-projects.sql in Supabase.
        // currency: formData.currency,
        // payment_method_in: formData.payment_method_in,
        // payment_method_out: formData.payment_method_out,
      })

      if (insertError) {
        setError(insertError.message)
        setIsLoading(false)
        return
      }

      router.push("/projects")
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
        <h1 className="text-3xl font-bold">Nuevo Proyecto</h1>
        <p className="text-muted-foreground">Crea un nuevo proyecto de edición</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información del Proyecto</CardTitle>
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
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client">Cliente</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
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
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Precio Total (Opcional)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value, payment_method_in: "" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ARS">Pesos Argentinos (ARS)</SelectItem>
                    <SelectItem value="USD">Dólares (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="default_price">Precio por Unidad (Cliente)</Label>
                <Input
                  id="default_price"
                  type="number"
                  step="0.01"
                  value={formData.default_price}
                  onChange={(e) => setFormData({ ...formData, default_price: e.target.value })}
                  placeholder="Ej. 1500.00"
                />
                <p className="text-xs text-muted-foreground">Se usará como valor predeterminado al crear tareas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_editor_price">Precio por Unidad (Editor)</Label>
                <Input
                  id="default_editor_price"
                  type="number"
                  step="0.01"
                  value={formData.default_editor_price}
                  onChange={(e) => setFormData({ ...formData, default_editor_price: e.target.value })}
                  placeholder="Ej. 800.00"
                />
                <p className="text-xs text-muted-foreground">Se usará como valor predeterminado al crear tareas</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="payment_method_in">Método de Cobro (Ingresos)</Label>
                {formData.currency === "USD" ? (
                  <Select
                    value={formData.payment_method_in}
                    onValueChange={(value) => setFormData({ ...formData, payment_method_in: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paypal">Paypal</SelectItem>
                      <SelectItem value="Binance">Binance</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="payment_method_in"
                    value={formData.payment_method_in}
                    onChange={(e) => setFormData({ ...formData, payment_method_in: e.target.value })}
                    placeholder="Ej. Transferencia, Efectivo"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method_out">Método de Pago (Egresos)</Label>
                <Input
                  id="payment_method_out"
                  value={formData.payment_method_out}
                  onChange={(e) => setFormData({ ...formData, payment_method_out: e.target.value })}
                  placeholder="Ej. Transferencia"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creando..." : "Crear Proyecto"}
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
