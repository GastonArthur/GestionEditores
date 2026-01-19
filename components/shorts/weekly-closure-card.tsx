
"use client"

import { WeeklyClosure, ShortsPlan } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Check, DollarSign, RefreshCw, Lock, Receipt } from "lucide-react"

interface WeeklyClosureCardProps {
  closure?: WeeklyClosure | null
  plan: ShortsPlan
  isAdmin?: boolean
}

export function WeeklyClosureCard({ closure, plan, isAdmin }: WeeklyClosureCardProps) {
  
  if (!closure) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Cierre Semanal</CardTitle>
                  <CardDescription>No hay cierre activo para esta semana.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Button variant="outline" className="w-full">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generar Semana
                  </Button>
              </CardContent>
          </Card>
      )
  }

  const percentage = closure.total_shorts_required > 0 
    ? (closure.total_shorts_completed / closure.total_shorts_required) * 100 
    : 0
    
  // Estimate payment
  // If payment_mode is proportional
  let estimatedPayment = plan.weekly_rate_editor
  if (plan.payment_mode === 'proportional') {
      estimatedPayment = (plan.weekly_rate_editor * percentage) / 100
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen Semanal</CardTitle>
        <CardDescription>
            {closure.week_start_date} al {closure.week_end_date}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progreso</span>
                <span className="font-bold">{closure.total_shorts_completed} / {closure.total_shorts_required}</span>
            </div>
            <Progress value={percentage} className="h-2" />
            <p className="text-xs text-right text-muted-foreground">{percentage.toFixed(0)}% Completado</p>
        </div>
        
        <div className="space-y-3 pt-4 border-t">
            <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pago Editor</span>
                <span className="font-bold text-lg text-green-600">
                    {plan.currency} {estimatedPayment.toFixed(2)}
                </span>
            </div>
            {isAdmin && (
             <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Cobro Cliente</span>
                <span className="font-bold text-lg">
                    {plan.currency} {plan.weekly_rate_client.toFixed(2)}
                </span>
            </div>
            )}
        </div>

        {isAdmin && (
            <div className="flex gap-2 pt-4">
                <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
                    disabled={closure.status !== 'open'}
                    title="Confirmar Cierre"
                >
                    <Check className="h-4 w-4" />
                </Button>
                 <Button 
                    className="flex-1"
                    variant="outline" 
                    title="Marcar Pago Editor"
                    disabled={closure.status === 'open'}
                 >
                    <DollarSign className="h-4 w-4 text-green-600" />
                </Button>
                 <Button 
                    className="flex-1"
                    variant="outline"
                    title="Marcar Cobro Cliente"
                 >
                    <Receipt className="h-4 w-4 text-blue-600" />
                </Button>
            </div>
        )}
        
        {isAdmin && closure.status !== 'open' && (
             <Button variant="ghost" className="w-full text-xs text-muted-foreground mt-2">
                <Lock className="h-3 w-3 mr-1" /> Reabrir cierre
             </Button>
        )}
      </CardContent>
    </Card>
  )
}
