"use client"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"

export default function AdvertisementPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect to services page since we're now using services instead of individual ads
    navigate("/services")
  }, [navigate])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-4" />
        <p className="text-white">Redirecting to services...</p>
      </div>
    </div>
  )
}
