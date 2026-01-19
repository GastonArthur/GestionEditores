
"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { addDays, format, parseISO, startOfWeek, getDay } from "date-fns"

const planSchema = z.object({
  client_id: z.string().uuid(),
  editor_id: z.string().uuid(),
  shorts_per_day: z.coerce.number().min(1),
  active_days: z.array(z.coerce.number()).min(1),
  weekly_rate_client: z.coerce.number().min(0),
  weekly_rate_editor: z.coerce.number().min(0),
  start_date: z.string(), // YYYY-MM-DD
  currency: z.string().default("USD"),
  timezone: z.string().default("America/Argentina/Buenos_Aires"),
})

export type CreatePlanSchema = z.infer<typeof planSchema>

export async function createShortsPlanAction(data: CreatePlanSchema) {
  const supabase = await createClient()
  
  const validated = planSchema.parse(data)

  const { data: plan, error } = await supabase
    .from("shorts_plans")
    .insert(validated)
    .select()
    .single()

  if (error) {
    console.error("Error creating plan:", error)
    throw new Error(error.message)
  }

  // Generate tasks for the first week
  await generateWeeklyTasks(plan.id, validated.start_date)

  revalidatePath("/shorts")
  // We redirect in the component or here. If here, it must be the last statement.
}

export async function generateWeeklyTasks(planId: string, weekStartDateStr: string) {
  const supabase = await createClient()

  // Fetch plan
  const { data: plan } = await supabase
    .from("shorts_plans")
    .select("*")
    .eq("id", planId)
    .single()

  if (!plan) throw new Error("Plan not found")

  const startDate = parseISO(weekStartDateStr)
  // Ensure we start from the given date, but usually weekly tasks align with Monday?
  // The requirement says "Semana definida por: Lunes–Domingo (configurable)".
  // For now let's assume the passed date IS the start of the generation.
  
  // We generate tasks for 7 days starting from startDate
  const tasksToInsert = []
  
  for (let i = 0; i < 7; i++) {
    const currentDate = addDays(startDate, i)
    // 0 = Sunday, 1 = Monday, ... 6 = Saturday in date-fns getDay
    // My DB convention: 0=Sunday, 1=Monday... same as date-fns
    const dayOfWeek = getDay(currentDate)
    
    if (plan.active_days.includes(dayOfWeek)) {
      // Generate tasks for this day
      for (let j = 1; j <= plan.shorts_per_day; j++) {
        tasksToInsert.push({
          plan_id: plan.id,
          editor_id: plan.editor_id,
          client_id: plan.client_id,
          title: `Short #${j}`,
          status: "pending",
          due_date: format(currentDate, "yyyy-MM-dd"),
          // unique constraint will prevent duplicates if run again
        })
      }
    }
  }

  if (tasksToInsert.length > 0) {
    const { error } = await supabase
      .from("shorts_tasks")
      .upsert(tasksToInsert, { 
        onConflict: "plan_id, due_date, title", 
        ignoreDuplicates: true 
      })
      
    if (error) {
      console.error("Error generating tasks:", error)
      throw new Error(error.message)
    }
  }
  
  // Create/Upsert Weekly Closure record (initially open)
  // Calculate week end date (Sunday)
  // If start date is Monday (1), end date is Sunday (0).
  // Assuming weekStartDate is the start.
  const weekEndDate = addDays(startDate, 6)
  
  const totalRequired = tasksToInsert.length
  
  const { error: closureError } = await supabase
    .from("weekly_closures")
    .upsert({
      plan_id: plan.id,
      editor_id: plan.editor_id,
      week_start_date: format(startDate, "yyyy-MM-dd"),
      week_end_date: format(weekEndDate, "yyyy-MM-dd"),
      total_shorts_required: totalRequired,
      total_shorts_completed: 0,
      compliance_percentage: 0,
      editor_payment_amount: 0, // Will be calculated on closure
      client_charge_amount: 0,  // Will be calculated on closure
      status: "open"
    }, {
        onConflict: "plan_id, week_start_date",
        ignoreDuplicates: true // Don't overwrite if exists
    })
    
    if (closureError) {
        console.error("Error creating closure:", closureError)
    }
}
