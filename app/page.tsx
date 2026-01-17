"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getAuthUser } from "@/lib/auth"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const user = getAuthUser()
    if (!user) {
      router.push("/login")
      return
    }

    if (user.role === "admin") {
      router.push("/admin")
    } else {
      router.push("/editor")
    }
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )
}
