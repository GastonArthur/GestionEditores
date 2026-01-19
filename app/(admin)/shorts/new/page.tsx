import { createClient } from "@/lib/supabase/server"
import { CreatePlanForm } from "@/components/shorts/create-plan-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function NewShortsPlanPage() {
  const supabase = await createClient()
  
  let clients = []
  let editors = []
  let error = null

  try {
    const results = await Promise.all([
      supabase.from("clients").select("id, name").eq("is_active", true),
      supabase.from("profiles").select("id, full_name").eq("role", "editor").eq("is_active", true)
    ])

    const clientsResult = results[0]
    const editorsResult = results[1]

    if (clientsResult.error) throw new Error(`Error loading clients: ${clientsResult.error.message}`)
    if (editorsResult.error) throw new Error(`Error loading editors: ${editorsResult.error.message}`)

    clients = clientsResult.data || []
    editors = editorsResult.data || []
  } catch (e) {
    console.error("Error loading data for new shorts plan:", e)
    error = e instanceof Error ? e.message : "Error desconocido al cargar datos"
  }

  return (
    <div className="space-y-6 p-8 max-w-4xl mx-auto">
      <Link href="/shorts">
        <Button variant="ghost" className="mb-4 pl-0 hover:pl-2 transition-all">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Planes
        </Button>
      </Link>
      
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Nuevo Plan de Shorts</h1>
        <p className="text-muted-foreground">Configura un plan recurrente para la asignación automática de tareas.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No se pudieron cargar los datos necesarios: {error}
            <br />
            Por favor verifica tu conexión a la base de datos.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configuración del Plan</CardTitle>
          <CardDescription>
            Define el cliente, editor y las reglas de generación de tareas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreatePlanForm 
            clients={clients} 
            editors={editors} 
          />
        </CardContent>
      </Card>
    </div>
  )
}
