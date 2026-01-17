"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Column<T> {
  key: keyof T | string
  label: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchPlaceholder?: string
  filters?: { key: string; label: string; active: boolean }[]
  onFilterToggle?: (key: string) => void
  onCreate?: () => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  onView?: (item: T) => void
  itemsPerPage?: number
  getItemId: (item: T) => string
  getItemName?: (item: T) => string
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = "Buscar...",
  filters = [],
  onFilterToggle,
  onCreate,
  onEdit,
  onDelete,
  onView,
  itemsPerPage = 10,
  getItemId,
  getItemName,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [deleteItem, setDeleteItem] = useState<T | null>(null)

  // Filter data by search
  const filteredData = data.filter((item) => {
    const searchLower = search.toLowerCase()
    return columns.some((col) => {
      const value = (item as Record<string, unknown>)[col.key as string]
      return value?.toString().toLowerCase().includes(searchLower)
    })
  })

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortKey) return 0
    const aVal = (a as Record<string, unknown>)[sortKey]
    const bVal = (b as Record<string, unknown>)[sortKey]
    if (aVal === bVal) return 0
    const comparison = aVal! > bVal! ? 1 : -1
    return sortOrder === "asc" ? comparison : -comparison
  })

  // Paginate
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  const handleDelete = () => {
    if (deleteItem && onDelete) {
      onDelete(deleteItem)
      setDeleteItem(null)
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header with search, filters, and create */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Filter chips */}
            {filters.map((filter) => (
              <Badge
                key={filter.key}
                variant={filter.active ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => onFilterToggle?.(filter.key)}
              >
                {filter.label}
              </Badge>
            ))}

            {onCreate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={onCreate} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Crear nuevo</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key as string}>
                    {col.sortable ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        onClick={() => handleSort(col.key as string)}
                      >
                        {col.label}
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    ) : (
                      col.label
                    )}
                  </TableHead>
                ))}
                {(onView || onEdit || onDelete) && <TableHead className="w-[100px] text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
                    No se encontraron resultados
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => (
                  <TableRow key={getItemId(item)}>
                    {columns.map((col) => (
                      <TableCell key={col.key as string}>
                        {col.render
                          ? col.render(item)
                          : String((item as Record<string, unknown>)[col.key as string] ?? "-")}
                      </TableCell>
                    ))}
                    {(onView || onEdit || onDelete) && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {onView && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(item)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ver</TooltipContent>
                            </Tooltip>
                          )}
                          {onEdit && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar</TooltipContent>
                            </Tooltip>
                          )}
                          {onDelete && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteItem(item)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Eliminar</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, sortedData.length)} de {sortedData.length}
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-transparent"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-transparent"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Delete confirmation dialog */}
        <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar este elemento?</AlertDialogTitle>
              <AlertDialogDescription>
                {getItemName && deleteItem
                  ? `¿Estás seguro de eliminar "${getItemName(deleteItem)}"? Esta acción no se puede deshacer.`
                  : "Esta acción no se puede deshacer."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
