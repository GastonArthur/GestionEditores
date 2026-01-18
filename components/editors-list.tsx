"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Pencil } from "lucide-react"
import Link from "next/link"

interface Editor {
  id: string
  full_name: string
  email: string
  phone: string | null
}

export function EditorsList({ editors }: { editors: Editor[] }) {
  if (!editors.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No hay editores registrados</p>
          <Link href="/contacts/editors/new">
            <Button className="mt-4 bg-transparent" variant="outline">
              Agregar el primero
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {editors.map((editor) => (
        <Card key={editor.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{editor.full_name}</CardTitle>
              <Link href={`/contacts/editors/${editor.id}/edit`}>
                <Button size="icon" variant="ghost">
                  <Pencil className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${editor.email}`} className="hover:underline">
                {editor.email}
              </a>
            </div>
            {editor.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${editor.phone}`} className="hover:underline">
                  {editor.phone}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
