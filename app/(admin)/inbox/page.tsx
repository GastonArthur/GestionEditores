"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Clock, DollarSign, UserX, Check, ArrowRight } from "lucide-react"
import Link from "next/link"
import type { Project } from "@/lib/types"

interface InboxItem {
  id: string
  type: "overdue" | "payment_client" | "payment_editor" | "no_editor" | "no_due_date"
  project: Project
  message: string
}

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInbox()
  }, [])

  const loadInbox = async () => {
    const supabase = createClient()
    const { data: projects } = await supabase
      .from("projects")
      .select("*, client:clients(*), editor:profiles(*)")
      .neq("status", "cancelled")

    const today = new Date().toISOString().split("T")[0]
    const newItems: InboxItem[] = []

    projects?.forEach((p) => {
      // Vencidos
      if (p.due_date && p.due_date < today && p.status !== "completed") {
        newItems.push({
          id: `overdue-${p.id}`,
          type: "overdue",
          project: p,
          message: `Vencido hace ${Math.ceil((new Date().getTime() - new Date(p.due_date).getTime()) / (1000 * 60 * 60 * 24))} días`,
        })
      }
      // Cobro pendiente
      if (p.status === "completed" && !p.payment_received) {
        newItems.push({
          id: `payment-client-${p.id}`,
          type: "payment_client",
          project: p,
          message: `Cobrar $${Number(p.billed_amount).toLocaleString()}`,
        })
      }
      // Pago a editor pendiente
      if (p.status === "completed" && !p.payment_made && p.editor_id) {
        newItems.push({
          id: `payment-editor-${p.id}`,
          type: "payment_editor",
          project: p,
          message: `Pagar $${Number(p.editor_payment).toLocaleString()} a ${p.editor?.full_name || "editor"}`,
        })
      }
      // Sin editor
      if (!p.editor_id && !["completed", "cancelled"].includes(p.status)) {
        newItems.push({
          id: `no-editor-${p.id}`,
          type: "no_editor",
          project: p,
          message: "Sin editor asignado",
        })
      }
      // Sin fecha de entrega
      if (!p.due_date && !["completed", "cancelled"].includes(p.status)) {
        newItems.push({
          id: `no-due-${p.id}`,
          type: "no_due_date",
          project: p,
          message: "Sin fecha de entrega",
        })
      }
    })

    setItems(newItems)
    setLoading(false)
  }

  const markAsResolved = async (item: InboxItem) => {
    const supabase = createClient()
    const updates: Record<string, boolean> = {}

    if (item.type === "payment_client") updates.payment_received = true
    if (item.type === "payment_editor") updates.payment_made = true

    if (Object.keys(updates).length > 0) {
      await supabase.from("projects").update(updates).eq("id", item.project.id)
      loadInbox()
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "overdue":
        return <Clock className="h-4 w-4 text-destructive" />
      case "payment_client":
      case "payment_editor":
        return <DollarSign className="h-4 w-4 text-amber-500" />
      case "no_editor":
        return <UserX className="h-4 w-4 text-orange-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getBadge = (type: string) => {
    switch (type) {
      case "overdue":
        return <Badge variant="destructive">Vencido</Badge>
      case "payment_client":
        return <Badge className="bg-amber-500">Cobrar</Badge>
      case "payment_editor":
        return <Badge className="bg-orange-500">Pagar</Badge>
      case "no_editor":
        return <Badge variant="secondary">Sin editor</Badge>
      default:
        return <Badge variant="outline">Pendiente</Badge>
    }
  }

  const filterByType = (type: string) => items.filter((i) => i.type === type)

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
        <h1 className="text-3xl font-bold">Bandeja de Pendientes</h1>
        <p className="text-muted-foreground">Tareas y alertas que requieren tu atención</p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos ({items.length})</TabsTrigger>
          <TabsTrigger value="overdue">Vencidos ({filterByType("overdue").length})</TabsTrigger>
          <TabsTrigger value="payments">
            Pagos ({filterByType("payment_client").length + filterByType("payment_editor").length})
          </TabsTrigger>
          <TabsTrigger value="other">
            Otros ({filterByType("no_editor").length + filterByType("no_due_date").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <InboxList items={items} getIcon={getIcon} getBadge={getBadge} markAsResolved={markAsResolved} />
        </TabsContent>
        <TabsContent value="overdue" className="mt-4">
          <InboxList
            items={filterByType("overdue")}
            getIcon={getIcon}
            getBadge={getBadge}
            markAsResolved={markAsResolved}
          />
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <InboxList
            items={[...filterByType("payment_client"), ...filterByType("payment_editor")]}
            getIcon={getIcon}
            getBadge={getBadge}
            markAsResolved={markAsResolved}
          />
        </TabsContent>
        <TabsContent value="other" className="mt-4">
          <InboxList
            items={[...filterByType("no_editor"), ...filterByType("no_due_date")]}
            getIcon={getIcon}
            getBadge={getBadge}
            markAsResolved={markAsResolved}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InboxList({
  items,
  getIcon,
  getBadge,
  markAsResolved,
}: {
  items: InboxItem[]
  getIcon: (type: string) => React.ReactNode
  getBadge: (type: string) => React.ReactNode
  markAsResolved: (item: InboxItem) => void
}) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No hay pendientes en esta categoría
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getIcon(item.type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.project.title}</p>
                  <p className="text-sm text-muted-foreground">{item.message}</p>
                </div>
                {getBadge(item.type)}
              </div>
              <div className="flex items-center gap-2">
                {(item.type === "payment_client" || item.type === "payment_editor") && (
                  <Button size="sm" variant="outline" onClick={() => markAsResolved(item)}>
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Link href={`/projects/${item.project.id}`}>
                  <Button size="sm" variant="ghost">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
