
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ShortsTasksList } from "@/components/shorts/shorts-tasks-list"
import { WeeklyClosureCard } from "@/components/shorts/weekly-closure-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"

export default async function PlanDetailsPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params
  const supabase = await createClient()

  const { data: plan } = await supabase
    .from("shorts_plans")
    .select(`
      *,
      clients:client_id(name),
      editors:editor_id(full_name)
    `)
    .eq("id", planId)
    .single()

  if (!plan) return notFound()

  // Fetch closures (history)
  const { data: closures } = await supabase
    .from("weekly_closures")
    .select("*")
    .eq("plan_id", plan.id)
    .order("week_start_date", { ascending: false })

  const currentClosure = closures?.[0]

  // Fetch tasks for the current active closure/week
  // If no closure, just fetch recent tasks
  let tasksQuery = supabase
    .from("shorts_tasks")
    .select("*")
    .eq("plan_id", plan.id)
    .order("due_date", { ascending: true })

  if (currentClosure) {
      tasksQuery = tasksQuery
        .gte("due_date", currentClosure.week_start_date)
        .lte("due_date", currentClosure.week_end_date)
  } else {
      tasksQuery = tasksQuery.limit(50)
  }

  const { data: tasks } = await tasksQuery

  return (
     <div className="space-y-6 p-8">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link href="/shorts">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        {plan.clients.name} 
                        <Badge variant="outline" className="text-base font-normal">
                            {plan.editors.full_name}
                        </Badge>
                    </h1>
                    <p className="text-muted-foreground">Plan ID: {plan.id.slice(0,8)}...</p>
                </div>
            </div>
            <Button variant="ghost">
                <Settings className="mr-2 h-4 w-4" />
                Configurar
            </Button>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
           <div className="md:col-span-2 space-y-6">
              <ShortsTasksList 
                tasks={tasks || []} 
                planId={plan.id} 
                isAdmin={true}
              />
           </div>
           <div className="space-y-6">
              <WeeklyClosureCard 
                closure={currentClosure} 
                plan={plan}
                isAdmin={true}
              />
              
              <Card>
                  <CardHeader>
                      <CardTitle>Historial de Cierres</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-2">
                          {closures?.map(c => (
                              <div key={c.id} className="flex justify-between items-center text-sm border-b pb-2">
                                  <span>{c.week_start_date}</span>
                                  <Badge variant={c.status === 'open' ? 'default' : 'secondary'}>
                                      {c.status}
                                  </Badge>
                              </div>
                          ))}
                      </div>
                  </CardContent>
              </Card>
           </div>
        </div>
     </div>
  )
}
