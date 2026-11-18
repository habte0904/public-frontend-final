"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { X, Type, Contrast, MousePointer, Volume2 } from "lucide-react"
import { useEffect, useRef } from "react"

// Add these ARIA attributes and improve focus management
export function AccessibilityPanel({ isOpen, onClose }) {
  const [fontSize, setFontSize] = useState("normal")
  const [highContrast, setHighContrast] = useState(false)
  const [touchMode, setTouchMode] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const panelRef = useRef(null)

  // Focus trap for accessibility
  useEffect(() => {
    if (isOpen && panelRef.current) {
      // Focus the first interactive element when panel opens
      const firstButton = panelRef.current.querySelector('button')
      firstButton?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const applyAccessibilitySettings = () => {
    const body = document.body

    // Font size
    body.classList.remove("text-normal", "text-large", "text-extra-large")
    body.classList.add(`text-${fontSize}`)

    // High contrast
    if (highContrast) {
      body.classList.add("high-contrast")
    } else {
      body.classList.remove("high-contrast")
    }

    // Touch mode
    if (touchMode) {
      body.classList.add("touch-mode")
    } else {
      body.classList.remove("touch-mode")
    }

    // Reduce motion
    if (reduceMotion) {
      body.classList.add("reduce-motion")
    } else {
      body.classList.remove("reduce-motion")
    }
  }

  const handleSettingChange = (setting, value) => {
    switch (setting) {
      case "fontSize":
        setFontSize(value)
        break
      case "highContrast":
        setHighContrast(value)
        break
      case "touchMode":
        setTouchMode(value)
        break
      case "reduceMotion":
        setReduceMotion(value)
        break
    }

    // Apply settings after state update
    setTimeout(applyAccessibilitySettings, 0)
  }

    return (
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="accessibility-panel-title"
        ref={panelRef}
      >
        <Card className="w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 id="accessibility-panel-title" className="text-xl font-semibold">
              Accessibility Settings
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              aria-label="Close accessibility panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* ... rest of the component */}
        </Card>
      </div>
    )
  }
import { useEffect, useRef } from "react"
