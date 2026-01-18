"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DollarSign,
  Users,
  FolderKanban,
  CheckSquare,
  TrendingUp,
  Plus,
  Pencil,
  Trash2,
  Search,
  AlertCircle,
  Clock,
  UserX,
  Check,
  Eye,
  Settings,
  User,
  Calendar as CalendarIcon,
} from "lucide-react"
import type { Client, Profile, Project, PaymentFrequency } from "@/lib/types"
import { EDITOR_SECTIONS } from "@/lib/types"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { toast } from "sonner"

// Types
interface Stats {
  totalRevenue: number
  totalPayments: number
  netProfit: number
  clientsCount: number
  editorsCount: number
  activeProjects: number
  pendingTasks: number
}

interface InboxItem {
  id: string
  type: "overdue" | "payment_client" | "payment_editor" | "no_editor"
  project: Project
  message: string
}

type DateFilterType = "all" | "today" | "week" | "month" | "custom"

// Loading Component
const Loading = () => null

// Main Component
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  
  // Data states
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [editors, setEditors] = useState<Profile[]>([])
  const [userSections, setUserSections] = useState<Record<string, string[]>>({})
  
  // Filter states
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  
  // Search states
  const [projectSearch, setProjectSearch] = useState("")
  const [clientSearch, setClientSearch] = useState("")
  const [editorSearch, setEditorSearch] = useState("")
  
  // Dialog states
  const [projectDialog, setProjectDialog] = useState(false)
  const [clientDialog, setClientDialog] = useState(false)
  const [editorDialog, setEditorDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{type: string, item: any} | null>(null)
  const [viewProject, setViewProject] = useState<Project | null>(null)
  
  // Form states
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editingEditor, setEditingEditor] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Form data
  const [projectForm, setProjectForm] = useState({
    title: "", description: "", client_id: "", editor_id: "", 
    billed_amount: "", editor_payment: "", status: "pending", due_date: ""
  })
  const [clientForm, setClientForm] = useState({
    name: "", email: "", phone: "", company: "", notes: ""
  })
  const [editorForm, setEditorForm] = useState({
    username: "", password_hash: "", full_name: "", email: "", phone: "", 
    payment_frequency: "semanal" as PaymentFrequency
  })

  // Load all data
  const loadData = useCallback(async () => {
    try {
      const supabase = createClient()
      
      const [
        { data: tasksData, error: tasksError },
        { data: clientsData, error: clientsError },
        { data: editorsData, error: editorsError },
        { data: sectionsData }
      ] = await Promise.all([
        // Fetch tasks instead of projects, as tasks contain the financial info
        supabase.from("tasks").select("*, client:clients(*), editor:profiles(*)").order("created_at", { ascending: false }),
        supabase.from("clients").select("*").eq("is_active", true).order("name"),
        supabase.from("profiles").select("*").eq("role", "editor").eq("is_active", true).order("full_name"),
        supabase.from("user_permissions").select("*")
      ])

      if (tasksError) {
        console.error("Error loading tasks:", tasksError)
        toast.error("Error al cargar tareas")
      }
      if (clientsError) console.error("Error loading clients:", clientsError)
      if (editorsError) console.error("Error loading editors:", editorsError)

      // Map tasks to project interface to keep UI working
      const mappedProjects = (tasksData as any[])?.map(t => ({
        ...t,
        billed_amount: Number(t.billed_amount || 0),
        editor_payment: Number(t.editor_payment || 0)
      })) || []

      setProjects(mappedProjects)
      setClients(clientsData || [])
      setEditors(editorsData || [])

      // Organize sections by user
      const sections: Record<string, string[]> = {}
      sectionsData?.forEach((s) => {
        if (!sections[s.user_id]) sections[s.user_id] = []
        if (s.can_view) sections[s.user_id].push(s.section_key)
      })
      setUserSections(sections)

    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Error general al cargar datos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filter Projects by Date
  const dateFilteredProjects = useMemo(() => {
    if (dateFilter === "all") return projects

    const now = new Date()
    let start: Date, end: Date

    switch (dateFilter) {
      case "today":
        start = startOfDay(now)
        end = endOfDay(now)
        break
      case "week":
        start = startOfWeek(now, { weekStartsOn: 1 }) // Monday start
        end = endOfWeek(now, { weekStartsOn: 1 })
        break
      case "month":
        start = startOfMonth(now)
        end = endOfMonth(now)
        break
      case "custom":
        if (!dateRange.from) return projects
        start = startOfDay(dateRange.from)
        end = endOfDay(dateRange.to || dateRange.from)
        break
      default:
        return projects
    }

    return projects.filter(p => {
      // Use created_at for filtering by default
      const date = parseISO(p.created_at)
      return isWithinInterval(date, { start, end })
    })
  }, [projects, dateFilter, dateRange])

  // Calculate Stats based on filtered projects
  const stats: Stats = useMemo(() => {
    const totalRevenue = dateFilteredProjects
      .filter((p) => p.payment_received)
      .reduce((sum, p) => sum + Number(p.billed_amount || 0), 0)
    
    const totalPayments = dateFilteredProjects
      .filter((p) => p.payment_made)
      .reduce((sum, p) => sum + Number(p.editor_payment || 0), 0)
    
    const activeProjects = projects.filter((p) => !["completed", "cancelled"].includes(p.status)).length

    return {
      totalRevenue,
      totalPayments,
      netProfit: totalRevenue - totalPayments,
      clientsCount: clients.length,
      editorsCount: editors.length,
      activeProjects,
      pendingTasks: 0,
    }
  }, [dateFilteredProjects, projects, clients.length, editors.length])

  // Inbox items (always based on all active tasks)
  const inboxItems = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    const items: InboxItem[] = []
    projects.forEach((p) => {
      if (p.due_date && p.due_date < today && p.status !== "completed") {
        items.push({ id: `overdue-${p.id}`, type: "overdue", project: p, message: `Vencido` })
      }
      if (p.status === "completed" && !p.payment_received) {
        items.push({ id: `payment-client-${p.id}`, type: "payment_client", project: p, message: `Cobrar $${Number(p.billed_amount).toLocaleString()}` })
      }
      if (p.status === "completed" && !p.payment_made && p.editor_id) {
        items.push({ id: `payment-editor-${p.id}`, type: "payment_editor", project: p, message: `Pagar $${Number(p.editor_payment).toLocaleString()}` })
      }
      if (!p.editor_id && !["completed", "cancelled"].includes(p.status)) {
        items.push({ id: `no-editor-${p.id}`, type: "no_editor", project: p, message: "Sin editor" })
      }
    })
    return items
  }, [projects])

  // Project handlers
  const openProjectDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project)
      setProjectForm({
        title: project.title,
        description: project.description || "",
        client_id: project.client_id || "",
        editor_id: project.editor_id || "",
        billed_amount: String(project.billed_amount || ""),
        editor_payment: String(project.editor_payment || ""),
        status: project.status,
        due_date: project.due_date || ""
      })
    } else {
      setEditingProject(null)
      setProjectForm({ title: "", description: "", client_id: "", editor_id: "", billed_amount: "", editor_payment: "", status: "pending", due_date: "" })
    }
    setProjectDialog(true)
  }

  const saveProject = async () => {
    setSaving(true)
    const supabase = createClient()
    
    // We are saving to TASKS table, but we call it "Project" in UI
    const data = {
      title: projectForm.title,
      description: projectForm.description,
      client_id: projectForm.client_id || null,
      editor_id: projectForm.editor_id || null,
      billed_amount: Number(projectForm.billed_amount) || 0,
      editor_payment: Number(projectForm.editor_payment) || 0,
      status: projectForm.status,
      due_date: projectForm.due_date || null
    }

    let error = null

    if (editingProject) {
      const { error: err } = await supabase.from("tasks").update(data).eq("id", editingProject.id)
      error = err
    } else {
      const { error: err } = await supabase.from("tasks").insert(data)
      error = err
    }
    
    setSaving(false)
    
    if (error) {
      console.error("Error saving task:", error)
      toast.error("Error al guardar: " + error.message)
    } else {
      toast.success("Guardado correctamente")
      setProjectDialog(false)
      loadData()
    }
  }

  // Client handlers
  const openClientDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client)
      setClientForm({ name: client.name, email: client.email || "", phone: client.phone || "", company: client.company || "", notes: client.notes || "" })
    } else {
      setEditingClient(null)
      setClientForm({ name: "", email: "", phone: "", company: "", notes: "" })
    }
    setClientDialog(true)
  }

  const saveClient = async () => {
    setSaving(true)
    const supabase = createClient()
    
    let error = null
    if (editingClient) {
      const { error: err } = await supabase.from("clients").update(clientForm).eq("id", editingClient.id)
      error = err
    } else {
      const { error: err } = await supabase.from("clients").insert(clientForm)
      error = err
    }
    
    setSaving(false)
    
    if (error) {
      console.error("Error saving client:", error)
      toast.error("Error al guardar cliente: " + error.message)
    } else {
      toast.success("Cliente guardado correctamente")
      setClientDialog(false)
      loadData()
    }
  }

  // Editor handlers
  const openEditorDialog = (editor?: Profile) => {
    if (editor) {
      setEditingEditor(editor)
      setEditorForm({
        username: editor.username || "",
        password_hash: "",
        full_name: editor.full_name,
        email: editor.email || "",
        phone: editor.phone || "",
        payment_frequency: editor.payment_frequency || "semanal"
      })
    } else {
      setEditingEditor(null)
      setEditorForm({ username: "", password_hash: "", full_name: "", email: "", phone: "", payment_frequency: "semanal" })
    }
    setEditorDialog(true)
  }

  const saveEditor = async () => {
    setSaving(true)
    const supabase = createClient()
    const data = { ...editorForm }
    if (!data.password_hash && editingEditor) {
      delete (data as any).password_hash
    }

    let error = null
    if (editingEditor) {
      const { error: err } = await supabase.from("profiles").update(data).eq("id", editingEditor.id)
      error = err
    } else {
      const { error: err } = await supabase.from("profiles").insert({ ...data, role: "editor" })
      error = err
    }
    
    setSaving(false)
    
    if (error) {
      console.error("Error saving editor:", error)
      toast.error("Error al guardar editor: " + error.message)
    } else {
      toast.success("Editor guardado correctamente")
      setEditorDialog(false)
      loadData()
    }
  }

  // Delete handler
  const handleDelete = async () => {
    if (!deleteDialog) return
    const supabase = createClient()
    
    let error = null
    if (deleteDialog.type === "project") {
      const { error: err } = await supabase.from("tasks").delete().eq("id", deleteDialog.item.id)
      error = err
    } else if (deleteDialog.type === "client") {
      const { error: err } = await supabase.from("clients").update({ is_active: false }).eq("id", deleteDialog.item.id)
      error = err
    } else if (deleteDialog.type === "editor") {
      const { error: err } = await supabase.from("profiles").update({ is_active: false }).eq("id", deleteDialog.item.id)
      error = err
    }
    
    if (error) {
      console.error("Error deleting item:", error)
      toast.error("Error al eliminar: " + error.message)
    } else {
      toast.success("Elemento eliminado correctamente")
      setDeleteDialog(null)
      loadData()
    }
  }

  // Inbox action
  const markAsResolved = async (item: InboxItem) => {
    const supabase = createClient()
    const updates: Record<string, boolean> = {}
    if (item.type === "payment_client") updates.payment_received = true
    if (item.type === "payment_editor") updates.payment_made = true

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from("tasks").update(updates).eq("id", item.project.id)
      if (error) {
        toast.error("Error al actualizar estado")
      } else {
        toast.success("Estado actualizado")
        loadData()
      }
    }
  }

  // Toggle section permission
  const toggleSection = async (userId: string, sectionKey: string, isVisible: boolean) => {
    const supabase = createClient()
    await supabase.from("user_permissions").upsert(
      { user_id: userId, section_key: sectionKey, can_view: isVisible },
      { onConflict: "user_id,section_key" }
    )
    setUserSections((prev) => {
      const userSects = prev[userId] || []
      if (isVisible) {
        return { ...prev, [userId]: [...userSects, sectionKey] }
      } else {
        return { ...prev, [userId]: userSects.filter((s) => s !== sectionKey) }
      }
    })
  }

  // Display Filters
  const filteredProjects = dateFilteredProjects.filter(p => 
    (p.title || "").toLowerCase().includes(projectSearch.toLowerCase()) ||
    (p.client?.name || "").toLowerCase().includes(projectSearch.toLowerCase())
  )
  const filteredClients = clients.filter(c => 
    (c.name || "").toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.company || "").toLowerCase().includes(clientSearch.toLowerCase())
  )
  const filteredEditors = editors.filter(e => 
    (e.full_name || "").toLowerCase().includes(editorSearch.toLowerCase()) ||
    (e.username || "").toLowerCase().includes(editorSearch.toLowerCase())
  )

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  }
  const statusLabels: Record<string, string> = {
    pending: "Pendiente", in_progress: "En Progreso", completed: "Completado", cancelled: "Cancelado"
  }
  const frequencyLabels: Record<string, string> = {
    diario: "Diario", semanal: "Semanal", quincenal: "Quincenal", mensual: "Mensual", por_proyecto: "Por proyecto"
  }

  useSearchParams()

  if (loading) {
    return (
      <Suspense fallback={<Loading />}>
        <div className="flex h-full items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Suspense>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
          <p className="text-muted-foreground">Gestiona todo tu negocio desde un solo lugar</p>
        </div>
        
        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <Select value={dateFilter} onValueChange={(v: DateFilterType) => setDateFilter(v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el tiempo</SelectItem>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {dateFilter === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Seleccionar fechas</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={(range: any) => setDateRange(range)}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}

          <div className="flex gap-2 ml-2">
            <Button onClick={() => openProjectDialog()} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Proyecto
            </Button>
            <Button onClick={() => openClientDialog()} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Cliente
            </Button>
            <Button onClick={() => openEditorDialog()} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Editor
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ingresos</p>
                <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <DollarSign className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagos</p>
                <p className="text-2xl font-bold">${stats.totalPayments.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ganancia</p>
                <p className="text-2xl font-bold">${stats.netProfit.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <FolderKanban className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Proyectos</p>
                <p className="text-2xl font-bold">{dateFilteredProjects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clientes</p>
                <p className="text-2xl font-bold">{stats.clientsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                <User className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Editores</p>
                <p className="text-2xl font-bold">{stats.editorsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts/Inbox */}
      {inboxItems.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Pendientes ({inboxItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {inboxItems.slice(0, 6).map((item) => (
                <Badge 
                  key={item.id} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-background flex items-center gap-2 py-1.5"
                  onClick={() => setViewProject(item.project)}
                >
                  {item.type === "overdue" && <Clock className="h-3 w-3 text-destructive" />}
                  {item.type === "payment_client" && <DollarSign className="h-3 w-3 text-green-600" />}
                  {item.type === "payment_editor" && <DollarSign className="h-3 w-3 text-orange-600" />}
                  {item.type === "no_editor" && <UserX className="h-3 w-3 text-muted-foreground" />}
                  <span className="max-w-[150px] truncate">{item.project.title}</span>
                  {(item.type === "payment_client" || item.type === "payment_editor") && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-5 w-5 p-0"
                      onClick={(e) => { e.stopPropagation(); markAsResolved(item) }}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </Badge>
              ))}
              {inboxItems.length > 6 && (
                <Badge variant="secondary">+{inboxItems.length - 6} más</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Proyectos</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="editors">Editores</TabsTrigger>
          <TabsTrigger value="settings">Permisos</TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Proyectos</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <Button onClick={() => openProjectDialog()} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proyecto</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Editor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.title}</TableCell>
                        <TableCell>{project.client?.name || "-"}</TableCell>
                        <TableCell>{project.editor?.full_name || "-"}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[project.status]}>
                            {statusLabels[project.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">${Number(project.billed_amount || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewProject(project)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openProjectDialog(project)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteDialog({type: "project", item: project})}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredProjects.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No hay proyectos
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Clientes</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <Button onClick={() => openClientDialog()} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.company || "-"}</TableCell>
                        <TableCell>{client.phone || "-"}</TableCell>
                        <TableCell>{client.email || "-"}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openClientDialog(client)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteDialog({type: "client", item: client})}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredClients.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No hay clientes
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Editors Tab */}
        <TabsContent value="editors" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Editores</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={editorSearch}
                      onChange={(e) => setEditorSearch(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <Button onClick={() => openEditorDialog()} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Pago</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEditors.map((editor) => (
                      <TableRow key={editor.id}>
                        <TableCell className="font-medium">{editor.full_name}</TableCell>
                        <TableCell>{editor.username}</TableCell>
                        <TableCell>{editor.phone || "-"}</TableCell>
                        <TableCell>{editor.email || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{frequencyLabels[editor.payment_frequency || "semanal"]}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditorDialog(editor)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteDialog({type: "editor", item: editor})}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredEditors.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No hay editores
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings/Permissions Tab */}
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Permisos de Editores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editors.filter(e => e.username).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No hay editores con acceso al sistema</p>
              ) : (
                <div className="space-y-6">
                  {editors.filter(e => e.username).map((editor) => (
                    <div key={editor.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{editor.full_name}</span>
                        <Badge variant="outline">{editor.username}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pl-6">
                        {EDITOR_SECTIONS.map((section) => (
                          <div key={section.key} className="flex items-center gap-2">
                            <Switch
                              id={`${editor.id}-${section.key}`}
                              checked={userSections[editor.id]?.includes(section.key) ?? true}
                              onCheckedChange={(checked) => toggleSection(editor.id, section.key, checked)}
                            />
                            <Label htmlFor={`${editor.id}-${section.key}`} className="text-sm">
                              {section.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <Separator />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

        {/* Project Dialog */}
        <Dialog open={projectDialog} onOpenChange={setProjectDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingProject ? "Editar Proyecto" : "Nuevo Proyecto"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="p-title">Título *</Label>
                <Input id="p-title" value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p-desc">Descripción</Label>
                <Textarea id="p-desc" rows={3} value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Cliente</Label>
                  <Select value={projectForm.client_id} onValueChange={(v) => setProjectForm({ ...projectForm, client_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Editor</Label>
                  <Select value={projectForm.editor_id} onValueChange={(v) => setProjectForm({ ...projectForm, editor_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {editors.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="p-billed">Monto a Cobrar</Label>
                  <Input id="p-billed" type="number" value={projectForm.billed_amount} onChange={(e) => setProjectForm({ ...projectForm, billed_amount: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="p-payment">Pago al Editor</Label>
                  <Input id="p-payment" type="number" value={projectForm.editor_payment} onChange={(e) => setProjectForm({ ...projectForm, editor_payment: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Estado</Label>
                  <Select value={projectForm.status} onValueChange={(v) => setProjectForm({ ...projectForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="in_progress">En Progreso</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="p-due">Fecha de Entrega</Label>
                  <Input id="p-due" type="date" value={projectForm.due_date} onChange={(e) => setProjectForm({ ...projectForm, due_date: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProjectDialog(false)}>Cancelar</Button>
              <Button onClick={saveProject} disabled={saving || !projectForm.title}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Client Dialog */}
        <Dialog open={clientDialog} onOpenChange={setClientDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingClient ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="c-name">Nombre *</Label>
                <Input id="c-name" value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="c-company">Empresa</Label>
                <Input id="c-company" value={clientForm.company} onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="c-phone">Teléfono</Label>
                  <Input id="c-phone" value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c-email">Email</Label>
                  <Input id="c-email" type="email" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="c-notes">Notas</Label>
                <Textarea id="c-notes" rows={3} value={clientForm.notes} onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setClientDialog(false)}>Cancelar</Button>
              <Button onClick={saveClient} disabled={saving || !clientForm.name}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Editor Dialog */}
        <Dialog open={editorDialog} onOpenChange={setEditorDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingEditor ? "Editar Editor" : "Nuevo Editor"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="e-name">Nombre *</Label>
                  <Input id="e-name" value={editorForm.full_name} onChange={(e) => setEditorForm({ ...editorForm, full_name: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="e-user">Usuario *</Label>
                  <Input id="e-user" value={editorForm.username} onChange={(e) => setEditorForm({ ...editorForm, username: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="e-pass">{editingEditor ? "Nueva Contraseña (dejar vacío para mantener)" : "Contraseña *"}</Label>
                <Input id="e-pass" type="password" value={editorForm.password_hash} onChange={(e) => setEditorForm({ ...editorForm, password_hash: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="e-phone">Teléfono</Label>
                  <Input id="e-phone" value={editorForm.phone} onChange={(e) => setEditorForm({ ...editorForm, phone: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="e-email">Email</Label>
                  <Input id="e-email" type="email" value={editorForm.email} onChange={(e) => setEditorForm({ ...editorForm, email: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Frecuencia de Pago</Label>
                <Select value={editorForm.payment_frequency} onValueChange={(v) => setEditorForm({ ...editorForm, payment_frequency: v as PaymentFrequency })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diario">Diario</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="quincenal">Quincenal</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="por_proyecto">Por proyecto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditorDialog(false)}>Cancelar</Button>
              <Button onClick={saveEditor} disabled={saving || !editorForm.full_name || !editorForm.username || (!editingEditor && !editorForm.password_hash)}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Project Dialog */}
        <Dialog open={!!viewProject} onOpenChange={() => setViewProject(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{viewProject?.title}</DialogTitle>
            </DialogHeader>
            {viewProject && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{viewProject.client?.name || "Sin asignar"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Editor</p>
                    <p className="font-medium">{viewProject.editor?.full_name || "Sin asignar"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Monto a Cobrar</p>
                    <p className="font-medium">${Number(viewProject.billed_amount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pago al Editor</p>
                    <p className="font-medium">${Number(viewProject.editor_payment || 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <Badge className={statusColors[viewProject.status]}>{statusLabels[viewProject.status]}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Entrega</p>
                    <p className="font-medium">{viewProject.due_date || "Sin fecha"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <CheckSquare className={`h-4 w-4 ${viewProject.payment_received ? "text-green-600" : "text-muted-foreground"}`} />
                    <span className="text-sm">{viewProject.payment_received ? "Pago recibido" : "Pago pendiente"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckSquare className={`h-4 w-4 ${viewProject.payment_made ? "text-green-600" : "text-muted-foreground"}`} />
                    <span className="text-sm">{viewProject.payment_made ? "Editor pagado" : "Editor sin pagar"}</span>
                  </div>
                </div>
                {viewProject.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Descripción</p>
                    <p className="text-sm">{viewProject.description}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewProject(null)}>Cerrar</Button>
              <Button onClick={() => { openProjectDialog(viewProject!); setViewProject(null) }}>Editar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar este elemento?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }