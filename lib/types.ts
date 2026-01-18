export type UserRole = "admin" | "editor"
export type PaymentFrequency = "diario" | "semanal" | "quincenal" | "mensual" | "por_proyecto"
export type ProjectStatus = "pending" | "in_progress" | "review" | "completed" | "cancelled"
export type TaskStatus = "pending" | "in_progress" | "completed"

export interface Profile {
  id: string
  username?: string | null
  password_hash?: string | null
  full_name: string
  email?: string
  phone?: string
  role: UserRole
  payment_frequency?: PaymentFrequency
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserPermission {
  id: string
  user_id: string
  section_key: string
  can_view: boolean
}

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProjectTemplate {
  id: string
  name: string
  description?: string
  default_tasks: { title: string; description?: string }[]
  default_content_type?: string
  default_content_quantity: number
  is_active: boolean
}

export interface Project {
  id: string
  title: string
  description?: string
  client_id?: string
  editor_id?: string
  template_id?: string
  status: ProjectStatus
  content_type?: string
  content_quantity: number
  due_date?: string
  billed_amount: number
  editor_payment: number
  net_profit: number
  billed_by?: string
  paid_by?: string
  payment_received: boolean
  payment_made: boolean
  delivered_at?: string
  created_at: string
  updated_at: string
  // Relations
  client?: Client
  editor?: Profile
}

export interface Task {
  id: string
  project_id?: string
  title: string
  description?: string
  status: TaskStatus
  assigned_to?: string
  due_date?: string
  sort_order: number
  created_at: string
  updated_at: string
  // Relations
  project?: Project
  assignee?: Profile
}

export interface ProjectComment {
  id: string
  project_id: string
  user_id?: string
  content: string
  attachment_url?: string
  is_system: boolean
  created_at: string
  user?: Profile
}

export interface ActivityLog {
  id: string
  user_id?: string
  action: string
  entity_type: string
  entity_id?: string
  entity_name?: string
  details?: Record<string, unknown>
  ip_address?: string
  created_at: string
  user?: Profile
}

export interface Payment {
  id: string
  project_id?: string
  type: "income" | "expense"
  amount: number
  payment_method?: string
  reference?: string
  notes?: string
  paid_at: string
  created_by?: string
  created_at: string
  project?: Project
  creator?: Profile
}

// Secciones disponibles
export const ADMIN_SECTIONS = [
  { key: "dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { key: "inbox", label: "Bandeja", icon: "Inbox" },
  { key: "projects", label: "Proyectos", icon: "FolderKanban" },
  { key: "clients", label: "Clientes", icon: "Users" },
  { key: "editors", label: "Editores", icon: "UserCircle" },
  { key: "payments", label: "Pagos", icon: "DollarSign" },
  { key: "reports", label: "Reportes", icon: "BarChart3" },
  { key: "settings", label: "Configuración", icon: "Settings" },
] as const

export const EDITOR_SECTIONS = [
  { key: "dashboard", label: "Mi Panel", icon: "LayoutDashboard" },
  { key: "my_tasks", label: "Mis Tareas", icon: "CheckSquare" },
  { key: "my_projects", label: "Mis Proyectos", icon: "FolderKanban" },
  { key: "my_payments", label: "Mis Pagos", icon: "DollarSign" },
] as const
