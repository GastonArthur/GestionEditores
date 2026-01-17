"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface TopClientsChartProps {
  data: { name: string; billed: number }[]
}

export function TopClientsChart({ data }: TopClientsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Clientes por Facturación</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <XAxis type="number" tickFormatter={(value) => `$${value}`} className="text-xs" />
              <YAxis dataKey="name" type="category" width={100} className="text-xs" />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Facturado"]}
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              />
              <Bar dataKey="billed" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
