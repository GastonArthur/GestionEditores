
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Video, Calendar, User } from "lucide-react"
import Link from "next/link"

export default async function ShortsPlansPage() {
  const supabase = await createClient()

  // Fetch plans with related data
  // Using explicit type casting or allowing any if types are not generated yet
  const { data: plans } = await supabase
    .from("shorts_plans")
    .select(`
      *,
      clients:client_id(name),
      editors:editor_id(full_name)
    `)
    .order("created_at", { ascending: false })

  const statusColors: Record<string, string> = {
    active: "bg-green-500",
    inactive: "bg-gray-500",
    paused: "bg-yellow-500",
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planes de Shorts</h1>
          <p className="text-muted-foreground">Gestiona los planes diarios de edición de shorts</p>
        </div>
        <Link href="/shorts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Plan
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans?.map((plan: any) => (
          <Link key={plan.id} href={`/shorts/${plan.id}`}>
            <Card className="transition-all hover:shadow-md cursor-pointer hover:border-primary/50">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-primary" />
                    <CardTitle className="text-lg font-bold">
                       {plan.clients?.name || "Sin Cliente"}
                    </CardTitle>
                  </div>
                  <Badge className={statusColors[plan.status] || "bg-gray-500"}>
                    {plan.status === 'active' ? 'Activo' : plan.status === 'paused' ? 'Pausado' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
                    <User className="h-4 w-4" />
                    <span className="font-medium text-foreground">{plan.editors?.full_name || "Sin Editor"}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                   <div className="bg-muted/50 p-3 rounded-lg text-center">
                      <span className="block text-xs text-muted-foreground mb-1 uppercase tracking-wider">Shorts/Día</span>
                      <span className="text-xl font-bold">{plan.shorts_per_day}</span>
                   </div>
                   <div className="bg-muted/50 p-3 rounded-lg text-center">
                      <span className="block text-xs text-muted-foreground mb-1 uppercase tracking-wider">Días Activos</span>
                      <span className="text-xl font-bold">{plan.active_days?.length || 0}</span>
                   </div>
                </div>

                <div className="flex items-center justify-between border-t pt-3 mt-2">
                   <span className="text-xs font-medium text-muted-foreground">Tarifa Semanal</span>
                   <span className="font-bold text-green-600 text-lg">
                     {plan.currency} {plan.weekly_rate_client}
                   </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {(!plans || plans.length === 0) && (
          <Card className="col-span-full border-dashed bg-muted/10">
             <CardContent className="flex flex-col items-center justify-center py-12">
               <div className="p-4 bg-muted rounded-full mb-4">
                 <Video className="h-8 w-8 text-muted-foreground" />
               </div>
               <h3 className="text-xl font-semibold mb-2">No hay planes activos</h3>
               <p className="text-muted-foreground mb-6 max-w-md text-center">
                 Crea un plan para automatizar la asignación diaria de shorts a tus editores.
               </p>
               <Link href="/shorts/new">
                 <Button size="lg">Crear Primer Plan</Button>
               </Link>
             </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
