"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DataTable } from "@/components/data-table"
import { FormDialog } from "@/components/form-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { logActivity, getAuthUser } from "@/lib/auth"
import type { Profile, PaymentFrequency } from "@/lib/types"

export default function EditorsPage() {
  const [editors, setEditors] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEditor, setEditingEditor] = useState<Profile | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    password_hash: "",
    full_name: "",
    email: "",
    phone: "",
    payment_frequency: "semanal" as PaymentFrequency,
  })
  const [hasAccess, setHasAccess] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadEditors()
  }, [])

  const loadEditors = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "editor")
      .eq("is_active", true)
      .order("full_name")
    setEditors(data || [])
    setLoading(false)
  }

  const openCreate = () => {
    setEditingEditor(null)
    setFormData({ username: "", password_hash: "", full_name: "", email: "", phone: "", payment_frequency: "semanal" })
    setHasAccess(false)
    setDialogOpen(true)
  }

  const openEdit = (editor: Profile) => {
    setEditingEditor(editor)
    setFormData({
      username: editor.username || "",
      password_hash: "",
      full_name: editor.full_name,
      email: editor.email || "",
      phone: editor.phone || "",
      payment_frequency: editor.payment_frequency || "semanal",
    })
    setHasAccess(!!editor.username)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const user = getAuthUser()

    const data: any = { ...formData }
    
    // Si no tiene acceso, limpiamos username y password
    if (!hasAccess) {
      data.username = null
      data.password_hash = null
    } else {
      // Validaciones básicas si tiene acceso
      if (!data.username) {
        alert("El usuario es requerido si se habilita el acceso")
        setSaving(false)
        return
      }
      if (!editingEditor && !data.password_hash) {
        alert("La contraseña es requerida para nuevos usuarios con acceso")
        setSaving(false)
        return
      }
    }

    if (data.password_hash === "" && editingEditor) {
      delete data.password_hash
    }

    if (editingEditor) {
      const { error } = await supabase.from("profiles").update(data).eq("id", editingEditor.id)
      
      if (error) {
        alert("Error al actualizar editor: " + error.message)
        setSaving(false)
        return
      }

      await logActivity(user?.id || null, "update", "editor", editingEditor.id, data.full_name)
    } else {
      const { data: newEditor, error } = await supabase
        .from("profiles")
        .insert({ ...data, role: "editor" })
        .select()
        .single()
      
      if (error) {
        alert("Error al crear editor: " + error.message)
        setSaving(false)
        return
      }

      await logActivity(user?.id || null, "create", "editor", newEditor?.id, data.full_name)
    }

    setSaving(false)
    setDialogOpen(false)
    loadEditors()
  }

  const handleDelete = async (editor: Profile) => {
    const supabase = createClient()
    const user = getAuthUser()
    await supabase.from("profiles").update({ is_active: false }).eq("id", editor.id)
    await logActivity(user?.id || null, "delete", "editor", editor.id, editor.full_name)
    loadEditors()
  }

  const frequencyLabels: Record<string, string> = {
    diario: "Diario",
    semanal: "Semanal",
    quincenal: "Quincenal",
    mensual: "Mensual",
    por_proyecto: "Por proyecto",
  }

  const columns = [
    { key: "full_name", label: "Nombre", sortable: true },
    { 
      key: "username", 
      label: "Usuario",
      render: (e: Profile) => (
        e.username ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">Usuario</Badge>
            <span>{e.username}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm italic">Sin acceso</span>
        )
      )
    },
    { key: "phone", label: "Teléfono" },
    { key: "email", label: "Email" },
    {
      key: "payment_frequency",
      label: "Pago",
      render: (e: Profile) => <Badge variant="outline">{frequencyLabels[e.payment_frequency || "semanal"]}</Badge>,
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
        <h1 className="text-3xl font-bold">Editores</h1>
        <p className="text-muted-foreground">Gestiona tu equipo de editores</p>
      </div>

      <DataTable
        data={editors}
        columns={columns}
        searchPlaceholder="Buscar editor..."
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        getItemId={(e) => e.id}
        getItemName={(e) => e.full_name}
      />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingEditor ? "Editar Editor" : "Nuevo Editor"}
        onSubmit={handleSave}
        isLoading={saving}
      >
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Nombre completo *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center space-x-2 border p-4 rounded-md">
            <Switch id="has-access" checked={hasAccess} onCheckedChange={setHasAccess} />
            <Label htmlFor="has-access" className="font-medium cursor-pointer">
              Habilitar acceso al sistema (Usuario y Contraseña)
            </Label>
          </div>

          {hasAccess && (
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-muted/20">
              <div className="grid gap-2">
                <Label htmlFor="username">Usuario *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required={hasAccess}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">
                  {editingEditor ? "Nueva contraseña (opcional)" : "Contraseña *"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password_hash}
                  onChange={(e) => setFormData({ ...formData, password_hash: e.target.value })}
                  required={hasAccess && !editingEditor}
                />
              </div>
            </div>
          )}

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
            <Label>Frecuencia de pago</Label>
            <Select
              value={formData.payment_frequency}
              onValueChange={(v) => setFormData({ ...formData, payment_frequency: v as PaymentFrequency })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diario">Diario</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="quincenal">Quincenal</SelectItem>
                <SelectItem value="mensual">Mensual</SelectItem>
                <SelectItem value="por_proyecto">Por proyecto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormDialog>
    </div>
  )
}
