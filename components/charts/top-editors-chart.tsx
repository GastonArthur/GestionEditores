"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface TopEditorsChartProps {
  data: { name: string; payments: number }[]
}

export function TopEditorsChart({ data }: TopEditorsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Editores por Pagos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <XAxis type="number" tickFormatter={(value) => `$${value}`} className="text-xs" />
              <YAxis dataKey="name" type="category" width={100} className="text-xs" />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Pagos"]}
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
              <Bar dataKey="payments" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
