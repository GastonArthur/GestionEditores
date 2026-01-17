"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/data-table"
import { FormDialog } from "@/components/form-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { logActivity, getAuthUser } from "@/lib/auth"
import type { Client } from "@/lib/types"

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", company: "", notes: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("clients").select("*").eq("is_active", true).order("name")
    setClients(data || [])
    setLoading(false)
  }

  const openCreate = () => {
    setEditingClient(null)
    setFormData({ name: "", email: "", phone: "", company: "", notes: "" })
    setDialogOpen(true)
  }

  const openEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      company: client.company || "",
      notes: client.notes || "",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const user = getAuthUser()

    if (editingClient) {
      await supabase.from("clients").update(formData).eq("id", editingClient.id)
      await logActivity(user?.id || null, "update", "client", editingClient.id, formData.name)
    } else {
      const { data } = await supabase.from("clients").insert(formData).select().single()
      await logActivity(user?.id || null, "create", "client", data?.id, formData.name)
    }

    setSaving(false)
    setDialogOpen(false)
    loadClients()
  }

  const handleDelete = async (client: Client) => {
    const supabase = createClient()
    const user = getAuthUser()
    await supabase.from("clients").update({ is_active: false }).eq("id", client.id)
    await logActivity(user?.id || null, "delete", "client", client.id, client.name)
    loadClients()
  }

  const columns = [
    { key: "name", label: "Nombre", sortable: true },
    { key: "company", label: "Empresa", sortable: true },
    { key: "phone", label: "Teléfono" },
    { key: "email", label: "Email" },
    {
      key: "notes",
      label: "Notas",
      render: (c: Client) => (c.notes ? <Badge variant="outline">{c.notes.slice(0, 30)}...</Badge> : "-"),
    },
  ]

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">Gestiona tus clientes de edición</p>
      </div>

      <DataTable
        data={clients}
        columns={columns}
        searchPlaceholder="Buscar cliente..."
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        getItemId={(c) => c.id}
        getItemName={(c) => c.name}
      />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingClient ? "Editar Cliente" : "Nuevo Cliente"}
        onSubmit={handleSave}
        isLoading={saving}
      >
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company">Empresa</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>
      </FormDialog>
    </div>
  )
}
