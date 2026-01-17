"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { useEffect, useState } from "react"

interface Editor {
  id: string
  full_name: string
  email: string
}

interface EditorSummary {
  editor: Editor
  totalEarned: number
  totalPaid: number
  pending: number
  completedTasks: number
  payments: any[]
}

export function EditorPaymentsList({ editors }: { editors: Editor[] }) {
  const [summaries, setSummaries] = useState<EditorSummary[]>([])
  const [selectedEditor, setSelectedEditor] = useState<EditorSummary | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  })

  useEffect(() => {
    fetchSummaries()
  }, [editors])

  const fetchSummaries = async () => {
    const supabase = createClient()

    const summariesData = await Promise.all(
      editors.map(async (editor) => {
        const [{ data: tasks }, { data: payments }] = await Promise.all([
          supabase.from("tasks").select("payment_amount").eq("editor_id", editor.id).eq("status", "completed"),
          supabase.from("payments").select("*").eq("editor_id", editor.id).order("payment_date", { ascending: false }),
        ])

        const totalEarned = tasks?.reduce((sum, t) => sum + Number(t.payment_amount), 0) || 0
        const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

        return {
          editor,
          totalEarned,
          totalPaid,
          pending: totalEarned - totalPaid,
          completedTasks: tasks?.length || 0,
          payments: payments || [],
        }
      }),
    )

    setSummaries(summariesData)
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEditor) return

    const supabase = createClient()

    const { error } = await supabase.from("payments").insert({
      editor_id: selectedEditor.editor.id,
      amount: Number(paymentForm.amount),
      payment_date: paymentForm.payment_date,
      notes: paymentForm.notes || null,
    })

    if (!error) {
      setIsDialogOpen(false)
      setPaymentForm({
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        notes: "",
      })
      fetchSummaries()
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {summaries.map((summary) => (
        <Card key={summary.editor.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{summary.editor.full_name}</CardTitle>
                <p className="text-sm text-muted-foreground">{summary.editor.email}</p>
              </div>
              <Dialog
                open={isDialogOpen && selectedEditor?.editor.id === summary.editor.id}
                onOpenChange={(open) => {
                  setIsDialogOpen(open)
                  if (open) setSelectedEditor(summary)
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Pago
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Pago - {summary.editor.full_name}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddPayment} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Monto</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        required
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment_date">Fecha de Pago</Label>
                      <Input
                        id="payment_date"
                        type="date"
                        required
                        value={paymentForm.payment_date}
                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notas (opcional)</Label>
                      <Textarea
                        id="notes"
                        rows={2}
                        value={paymentForm.notes}
                        onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Registrar Pago
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Ganado:</span>
                <span className="font-semibold">${summary.totalEarned.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Pagado:</span>
                <span className="font-semibold text-green-600">${summary.totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pendiente:</span>
                <Badge variant={summary.pending > 0 ? "destructive" : "secondary"}>${summary.pending.toFixed(2)}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">Tareas Completadas:</span>
                <span className="font-semibold">{summary.completedTasks}</span>
              </div>
            </div>

            {summary.payments.length > 0 && (
              <div className="pt-3 border-t">
                <p className="text-sm font-medium mb-2">Últimos Pagos:</p>
                <div className="space-y-2">
                  {summary.payments.slice(0, 3).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {new Date(payment.payment_date).toLocaleDateString("es-ES")}
                      </span>
                      <span className="font-semibold">${Number(payment.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
