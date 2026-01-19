import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"
import { EditorColumn } from "@/components/editor-column"

export default async function TasksPage() {
  const supabase = await createClient()

  const [{ data: editors }, { data: tasks }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "editor")
      .eq("is_active", true)
      .order("full_name", { ascending: true }),
    supabase.from("tasks").select("*").order("created_at", { ascending: false }),
  ])

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Tareas</h1>
          <p className="text-muted-foreground">Administra las tareas de cada editor</p>
        </div>
        <Link href="/tasks/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tarea
          </Button>
        </Link>
      </div>

      {!editors?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No hay editores registrados</p>
            <Link href="/contacts">
              <Button className="mt-4 bg-transparent" variant="outline">
                Agregar Editor
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {editors.map((editor) => {
            const editorTasks =
              tasks?.filter((task) => task.editor_id === editor.id && task.status !== "completed") || []
            
            if (editorTasks.length === 0) return null

            return <EditorColumn key={editor.id} editor={editor} tasks={editorTasks} />
          })}
        </div>
      )}
    </div>
  )
}
