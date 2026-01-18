import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Users, Briefcase } from "lucide-react"
import Link from "next/link"
import { ClientsList } from "@/components/clients-list"
import { EditorsList } from "@/components/editors-list"

export default async function ContactsPage() {
  const supabase = await createClient()

  const [{ data: clients }, { data: editors }] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("users").select("*").eq("role", "editor").order("full_name"),
  ])

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Contactos</h1>
        <p className="text-muted-foreground">Gestiona clientes y editores</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Clientes registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Editores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{editors?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Editores en el equipo</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="editors">Editores</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <div className="flex justify-end">
            <Link href="/contacts/clients/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Cliente
              </Button>
            </Link>
          </div>
          <ClientsList clients={clients || []} />
        </TabsContent>

        <TabsContent value="editors" className="space-y-4">
          <div className="flex justify-end">
            <Link href="/contacts/editors/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Editor
              </Button>
            </Link>
          </div>
          <EditorsList editors={editors || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
