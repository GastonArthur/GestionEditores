"use client"

import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { useEffect, useState } from "react"
import { getAuthUser } from "@/lib/auth"
import { useRouter } from "next/navigation"

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ full_name: string; role: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    try {
      const authUser = getAuthUser()
      console.log("EditorLayout: checking auth", authUser)

      if (!authUser) {
        console.log("EditorLayout: no user, redirecting to login")
        router.push("/login")
        return
      }
      if (authUser.role !== "editor") {
        // If admin tries to access editor, maybe allow? or redirect to admin?
        // For now, let's strictly redirect to their dashboard if role mismatch
        console.log("EditorLayout: user is not editor, redirecting to admin")
        router.push("/admin")
        return
      }
      setUser(authUser)
      setLoading(false)
    } catch (e) {
      console.error("EditorLayout error:", e)
      router.push("/login")
    }
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
      <Sidebar role="editor" userName={user?.full_name} />
      <main className="flex-1 overflow-y-auto bg-muted/30 p-6">{children}</main>
    </div>
  )
}
