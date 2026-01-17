import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, CheckCircle } from "lucide-react"

export default async function EditorPaymentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: completedTasks }, { data: payments }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, payment_amount, completed_at, projects (title)")
      .eq("editor_id", user?.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false }),
    supabase
      .from("payments")
      .select("*")
      .eq("editor_id", user?.id)
      .order("payment_date", { ascending: false })
      .limit(10),
  ])

  const totalEarned = completedTasks?.reduce((sum, task) => sum + Number(task.payment_amount), 0) || 0
  const totalPaid = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0
  const pending = totalEarned - totalPaid

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Mis Pagos</h1>
        <p className="text-muted-foreground">Revisa tus ganancias y pagos recibidos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ganado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEarned.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">De tareas completadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagado</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Recibido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendiente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Por cobrar</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tareas Completadas</CardTitle>
        </CardHeader>
        <CardContent>
          {!completedTasks?.length ? (
            <p className="text-center text-muted-foreground py-8">No has completado tareas todavía</p>
          ) : (
            <div className="space-y-3">
              {completedTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="font-semibold">{task.title}</p>
                    <p className="text-sm text-muted-foreground">Proyecto: {task.projects?.title}</p>
                    {task.completed_at && (
                      <p className="text-xs text-muted-foreground">
                        Completada: {new Date(task.completed_at).toLocaleDateString("es-ES")}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-base font-semibold">
                    ${Number(task.payment_amount).toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {!payments?.length ? (
            <p className="text-center text-muted-foreground py-8">No hay pagos registrados</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="font-semibold">Pago recibido</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payment.payment_date).toLocaleDateString("es-ES")}
                    </p>
                    {payment.notes && <p className="text-sm text-muted-foreground">{payment.notes}</p>}
                  </div>
                  <Badge className="bg-green-500 text-base font-semibold">${Number(payment.amount).toFixed(2)}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
