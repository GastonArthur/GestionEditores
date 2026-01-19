
"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function confirmWeeklyClosure(closureId: string) {
  const supabase = await createClient()
  
  // 1. Update closure status
  const { data: closure, error } = await supabase
    .from("weekly_closures")
    .update({ status: 'confirmed' })
    .eq("id", closureId)
    .select()
    .single()

  if (error) throw new Error(error.message)

  // 2. Create Payment record (Expense - Editor)
  if (closure.editor_payment_amount > 0) {
      // Assuming 'payments' table exists from schema
      await supabase.from("payments").insert({
          type: 'expense',
          amount: closure.editor_payment_amount,
          notes: `Pago semanal shorts: ${closure.week_start_date}`,
          // project_id? user_id?
          // Schema says payments has project_id, but here we have plan_id. 
          // We might need to link to user directly if payments table supports it, or leave it generic.
          // For now, simple insert.
      })
  }

  // 3. Create Receivable/Invoice (Income - Client)
  // Assuming 'invoices' or similar exists, or use payments with type='income'
   if (closure.client_charge_amount > 0) {
      await supabase.from("payments").insert({
          type: 'income',
          amount: closure.client_charge_amount,
          notes: `Cobro semanal shorts: ${closure.week_start_date}`,
      })
  }

  revalidatePath("/shorts")
}

export async function markEditorPaid(closureId: string) {
    const supabase = await createClient()
    await supabase.from("weekly_closures").update({ status: 'paid_editor' }).eq("id", closureId)
    revalidatePath("/shorts")
}

export async function markClientCharged(closureId: string) {
    const supabase = await createClient()
    await supabase.from("weekly_closures").update({ status: 'charged_client' }).eq("id", closureId)
    revalidatePath("/shorts")
}
