import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { EditorPaymentsList } from "@/components/editor-payments-list"
import { WeeklyReportsView } from "@/components/weekly-reports-view"

export default async function AccountingPage() {
  const supabase = await createClient()

  const [{ data: projects }, { data: completedTasks }, { data: allTasks }, { data: payments }, { data: editors }] =
    await Promise.all([
      supabase.from("projects").select("billed_amount, status").eq("status", "completed"),
      supabase.from("tasks").select("payment_amount").eq("status", "completed"),
      supabase.from("tasks").select("payment_amount"),
      supabase.from("payments").select("amount"),
      supabase.from("users").select("id, full_name, email").eq("role", "editor"),
    ])

  const totalRevenue = projects?.reduce((sum, p) => sum + Number(p.billed_amount), 0) || 0
  const totalExpenses = completedTasks?.reduce((sum, t) => sum + Number(t.payment_amount), 0) || 0
  const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const pendingPayments = totalExpenses - totalPaid
  const netProfit = totalRevenue - totalExpenses

  const stats = [
    {
      title: "Ingresos Totales",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      description: "De proyectos completados",
    },
    {
      title: "Gastos en Editores",
      value: `$${totalExpenses.toFixed(2)}`,
      icon: TrendingDown,
      description: "Tareas completadas",
    },
    {
      title: "Pagos Pendientes",
      value: `$${pendingPayments.toFixed(2)}`,
      icon: Wallet,
      description: "Por pagar a editores",
    },
    {
      title: "Ganancia Neta",
      value: `$${netProfit.toFixed(2)}`,
      icon: DollarSign,
      description: "Ingresos - Gastos",
    },
  ]

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Contabilidad</h1>
        <p className="text-muted-foreground">Gestiona las finanzas y pagos del equipo</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Pagos por Editor</TabsTrigger>
          <TabsTrigger value="weekly">Reportes Semanales</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <EditorPaymentsList editors={editors || []} />
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <WeeklyReportsView editors={editors || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
