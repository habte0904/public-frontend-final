"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TRANSLATIONS } from "../../lib/constants/languages.js"
import { useEffect } from "react"
import { RotateCcw, Home, Star, Heart } from "lucide-react"

export function KioskThankYou({ language, onRestart }) {
  const t = TRANSLATIONS[language]

  useEffect(() => {
    // Auto-restart after 30 seconds
    const timer = setTimeout(() => {
      onRestart()
    }, 30000)

    return () => clearTimeout(timer)
  }, [onRestart])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <Card className="max-w-4xl w-full text-center bg-white border-amber-500 shadow-2xl rounded-2xl overflow-hidden p-12">
        {/* Success Icon */}
        <div className="mb-12">
          <div
            className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-xl"
            role="img"
            aria-label="Success"
          >
            <span className="text-5xl text-white" aria-hidden="true">
              ✓
            </span>
          </div>
          <h1 className="text-5xl font-bold text-balance mb-6 text-gray-900">{t.thankYou}</h1>
          <p className="text-2xl text-gray-600 text-balance mb-8">{t.feedbackReceived}</p>
        </div>

        <div className="mb-12 p-8 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-200">
          <div className="flex items-center justify-center mb-6">
            <Heart className="w-8 h-8 text-amber-600 mr-3" />
            <Star className="w-8 h-8 text-amber-600" />
            <Heart className="w-8 h-8 text-amber-600 ml-3" />
          </div>
          <p className="text-2xl text-gray-700 text-balance font-medium mb-4">{t.adwa}</p>
          <p className="text-lg text-gray-600 text-balance mb-4">{t.appreciateTime}</p>
          <p className="text-base text-amber-700 font-medium">
            Your voice helps preserve Ethiopian heritage for future generations
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-6">
          <div className="flex gap-6 justify-center">

            <Button
              variant="outline"
              size="lg"
              onClick={() => (window.location.href = "/")}
              className="border-amber-400 text-amber-600 hover:bg-amber-50 px-8 py-4 text-lg font-semibold rounded-xl"
            >
              <Home className="h-6 w-6 mr-3" />
              {t.returnHome}
            </Button>
          </div>
        </div>

        {/* Auto-restart notice */}
        <div className="mt-12 pt-8 border-t border-amber-200">
          <p className="text-base text-gray-600">{t.autoRestart}</p>
          <p className="text-sm text-gray-500 mt-2">This kiosk will automatically restart in 30 seconds</p>
        </div>
      </Card>
    </div>
  )
}
