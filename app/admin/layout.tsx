"use client"

import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { useEffect, useState } from "react"
import { getAuthUser } from "@/lib/auth"
import { useRouter } from "next/navigation"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ full_name: string; role: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const authUser = getAuthUser()
    if (!authUser) {
      router.push("/login")
      return
    }
    if (authUser.role !== "admin") {
      router.push("/editor")
      return
    }
    setUser(authUser)
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar role="admin" userName={user?.full_name} />
      <main className="flex-1 overflow-y-auto bg-muted/30 p-6">{children}</main>
    </div>
  )
}
