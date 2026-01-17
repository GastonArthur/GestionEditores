"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"

interface Editor {
  id: string
  full_name: string
  email: string
}

interface WeeklyReport {
  id: string
  editor_id: string
  week_start: string
  week_end: string
  total_videos: number
  total_tasks: number
  total_payment: number
  payment_status: string
  paid_at: string | null
}

export function WeeklyReportsView({ editors }: { editors: Editor[] }) {
  const [selectedEditor, setSelectedEditor] = useState<string>("")
  const [reports, setReports] = useState<WeeklyReport[]>([])

  useEffect(() => {
    if (selectedEditor) {
      fetchReports(selectedEditor)
    }
  }, [selectedEditor])

  const fetchReports = async (editorId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from("weekly_reports")
      .select("*")
      .eq("editor_id", editorId)
      .order("week_start", { ascending: false })

    if (data) setReports(data)
  }

  const generateWeeklyReport = async () => {
    if (!selectedEditor) return

    const supabase = createClient()

    const today = new Date()
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()))
    const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6))

    const { data: tasks } = await supabase
      .from("tasks")
      .select("video_count, payment_amount")
      .eq("editor_id", selectedEditor)
      .eq("status", "completed")
      .gte("completed_at", weekStart.toISOString())
      .lte("completed_at", weekEnd.toISOString())

    const totalVideos = tasks?.reduce((sum, t) => sum + t.video_count, 0) || 0
    const totalPayment = tasks?.reduce((sum, t) => sum + Number(t.payment_amount), 0) || 0

    const { error } = await supabase.from("weekly_reports").insert({
      editor_id: selectedEditor,
      week_start: weekStart.toISOString().split("T")[0],
      week_end: weekEnd.toISOString().split("T")[0],
      total_videos: totalVideos,
      total_tasks: tasks?.length || 0,
      total_payment: totalPayment,
      payment_status: "pending",
    })

    if (!error) {
      fetchReports(selectedEditor)
    }
  }

  const markAsPaid = async (reportId: string) => {
    const supabase = createClient()

    const { error } = await supabase
      .from("weekly_reports")
      .update({
        payment_status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", reportId)

    if (!error) {
      fetchReports(selectedEditor)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Generar Reporte Semanal</CardTitle>
        </CardHeader>
        <CardContent className="flex items-end gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Seleccionar Editor</label>
            <Select value={selectedEditor} onValueChange={setSelectedEditor}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar editor" />
              </SelectTrigger>
              <SelectContent>
                {editors.map((editor) => (
                  <SelectItem key={editor.id} value={editor.id}>
                    {editor.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generateWeeklyReport} disabled={!selectedEditor}>
            Generar Reporte
          </Button>
        </CardContent>
      </Card>

      {selectedEditor && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay reportes semanales para este editor
              </CardContent>
            </Card>
          ) : (
            reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Semana del {new Date(report.week_start).toLocaleDateString("es-ES")} al{" "}
                        {new Date(report.week_end).toLocaleDateString("es-ES")}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {editors.find((e) => e.id === report.editor_id)?.full_name}
                      </p>
                    </div>
                    <Badge className={report.payment_status === "paid" ? "bg-green-500" : "bg-yellow-500"}>
                      {report.payment_status === "paid" ? "Pagado" : "Pendiente"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tareas</p>
                      <p className="text-xl font-bold">{report.total_tasks}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Videos</p>
                      <p className="text-xl font-bold">{report.total_videos}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total a Pagar</p>
                      <p className="text-xl font-bold">${Number(report.total_payment).toFixed(2)}</p>
                    </div>
                  </div>

                  {report.payment_status === "pending" && (
                    <Button onClick={() => markAsPaid(report.id)} className="w-full" size="sm">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Marcar como Pagado
                    </Button>
                  )}

                  {report.paid_at && (
                    <p className="text-sm text-muted-foreground text-center pt-2 border-t">
                      Pagado el {new Date(report.paid_at).toLocaleDateString("es-ES")}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
