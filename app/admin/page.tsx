"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, FolderKanban, CheckSquare, TrendingUp, CreditCard, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Stats {
  totalRevenue: number
  totalPayments: number
  netProfit: number
  clientsCount: number
  editorsCount: number
  activeProjects: number
  pendingTasks: number
}

interface Alert {
  id: string
  type: "overdue" | "payment_pending" | "no_editor"
  message: string
  link: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()

        const [{ data: projects }, { count: clientsCount }, { count: editorsCount }, { count: pendingTasksCount }] =
          await Promise.all([
            supabase.from("projects").select("*"),
            supabase.from("clients").select("*", { count: "exact", head: true }).eq("is_active", true),
            supabase
              .from("profiles")
              .select("*", { count: "exact", head: true })
              .eq("role", "editor")
              .eq("is_active", true),
            supabase.from("tasks").select("*", { count: "exact", head: true }).neq("status", "completed"),
          ])

        const totalRevenue =
          projects?.filter((p) => p.payment_received).reduce((sum, p) => sum + Number(p.billed_amount || 0), 0) || 0
        const totalPayments =
          projects?.filter((p) => p.payment_made).reduce((sum, p) => sum + Number(p.editor_payment || 0), 0) || 0
        const activeProjects = projects?.filter((p) => !["completed", "cancelled"].includes(p.status)).length || 0

        setStats({
          totalRevenue,
          totalPayments,
          netProfit: totalRevenue - totalPayments,
          clientsCount: clientsCount || 0,
          editorsCount: editorsCount || 0,
          activeProjects,
          pendingTasks: pendingTasksCount || 0,
        })

        // Generar alertas
        const newAlerts: Alert[] = []
        const today = new Date().toISOString().split("T")[0]

        projects?.forEach((p) => {
          if (p.due_date && p.due_date < today && p.status !== "completed") {
            newAlerts.push({
              id: `overdue-${p.id}`,
              type: "overdue",
              message: `"${p.title}" está vencido`,
              link: `/admin/projects/${p.id}`,
            })
          }
          if (p.status === "completed" && !p.payment_received) {
            newAlerts.push({
              id: `payment-${p.id}`,
              type: "payment_pending",
              message: `Cobro pendiente: "${p.title}"`,
              link: `/admin/projects/${p.id}`,
            })
          }
          if (!p.editor_id && p.status !== "completed") {
            newAlerts.push({
              id: `no-editor-${p.id}`,
              type: "no_editor",
              message: `Sin editor: "${p.title}"`,
              link: `/admin/projects/${p.id}`,
            })
          }
        })

        setAlerts(newAlerts.slice(0, 5))
      } catch (error) {
        console.error("Error loading admin dashboard data:", error)
        // Set empty stats to avoid crashes
        setStats({
          totalRevenue: 0,
          totalPayments: 0,
          netProfit: 0,
          clientsCount: 0,
          editorsCount: 0,
          activeProjects: 0,
          pendingTasks: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

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
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Vista general de tu negocio</p>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              Alertas ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <Link key={alert.id} href={alert.link}>
                  <div className="flex items-center justify-between p-2 rounded-md hover:bg-destructive/10 transition-colors">
                    <span className="text-sm">{alert.message}</span>
                    <Badge
                      variant={
                        alert.type === "overdue"
                          ? "destructive"
                          : alert.type === "payment_pending"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {alert.type === "overdue" ? "Vencido" : alert.type === "payment_pending" ? "Cobro" : "Sin editor"}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <StatsCard
          title="Ingresos"
          value={`$${stats?.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          description="Cobrado"
        />
        <StatsCard
          title="Pagos"
          value={`$${stats?.totalPayments.toLocaleString()}`}
          icon={CreditCard}
          description="A editores"
        />
        <StatsCard
          title="Ganancia"
          value={`$${stats?.netProfit.toLocaleString()}`}
          icon={TrendingUp}
          description="Neta"
        />
        <StatsCard title="Clientes" value={stats?.clientsCount || 0} icon={Users} description="Activos" />
        <StatsCard title="Editores" value={stats?.editorsCount || 0} icon={Users} description="Activos" />
        <StatsCard title="Proyectos" value={stats?.activeProjects || 0} icon={FolderKanban} description="Activos" />
        <StatsCard title="Tareas" value={stats?.pendingTasks || 0} icon={CheckSquare} description="Pendientes" />
      </div>

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acciones rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/projects/new">
              <Button variant="outline" size="sm">
                <FolderKanban className="h-4 w-4 mr-2" />
                Nuevo proyecto
              </Button>
            </Link>
            <Link href="/admin/clients/new">
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Nuevo cliente
              </Button>
            </Link>
            <Link href="/admin/inbox">
              <Button variant="outline" size="sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                Ver bandeja
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
