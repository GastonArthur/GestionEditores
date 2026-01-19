
import { createClient } from "@/lib/supabase/server"
import { ShortsTasksList } from "@/components/shorts/shorts-tasks-list"
import { WeeklyClosureCard } from "@/components/shorts/weekly-closure-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { redirect } from "next/navigation"

export default async function EditorShortsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch active plan for this editor
  const { data: plans } = await supabase
    .from("shorts_plans")
    .select(`
      *,
      clients:client_id(name)
    `)
    .eq("editor_id", user.id)
    .eq("status", "active")
    .limit(1)

  const plan = plans?.[0]

  if (!plan) {
      return (
          <div className="p-8 space-y-4">
              <h1 className="text-3xl font-bold">Shorts Plan</h1>
              <Card>
                <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No tienes planes de shorts activos asignados actualmente.</p>
                </CardContent>
              </Card>
          </div>
      )
  }

  // Fetch current open closure to determine the week range
  const { data: closure } = await supabase
    .from("weekly_closures")
    .select("*")
    .eq("plan_id", plan.id)
    .eq("status", "open")
    .single()

  // Fetch tasks
  let tasksQuery = supabase
    .from("shorts_tasks")
    .select("*")
    .eq("plan_id", plan.id)
    .order("due_date", { ascending: true })

  if (closure) {
      tasksQuery = tasksQuery
        .gte("due_date", closure.week_start_date)
        .lte("due_date", closure.week_end_date)
  } else {
      tasksQuery = tasksQuery.limit(50)
  }

  const { data: tasks } = await tasksQuery

  return (
    <div className="space-y-6 p-8">
        <div>
           <h1 className="text-3xl font-bold">Mis Shorts - {plan.clients.name}</h1>
           <p className="text-muted-foreground">Plan diario: {plan.shorts_per_day} shorts</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
           <div className="md:col-span-2 space-y-6">
              <ShortsTasksList 
                tasks={tasks || []} 
                planId={plan.id} 
                isAdmin={false}
              />
           </div>
           <div>
              <WeeklyClosureCard 
                closure={closure} 
                plan={plan}
                isAdmin={false}
              />
           </div>
        </div>
    </div>
  )
}
