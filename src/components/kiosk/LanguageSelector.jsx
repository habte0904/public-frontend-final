"use client"

import { Button } from "@/components/ui/button"
import { TRANSLATIONS } from "../../lib/constants/languages"
import { useRef } from "react" // Add this import

export function LanguageSelector({ currentLanguage, onLanguageChange, className = "", size = "default" }) {
  const buttonRefs = useRef([])

  const handleKeyDown = (event, lang) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onLanguageChange(lang)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      const languages = Object.keys(TRANSLATIONS)
      const nextIndex = (languages.indexOf(lang) + 1) % languages.length
      buttonRefs.current[nextIndex]?.focus()
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      const languages = Object.keys(TRANSLATIONS)
      const prevIndex = (languages.indexOf(lang) - 1 + languages.length) % languages.length
      buttonRefs.current[prevIndex]?.focus()
    }
  }

  return (
    <div 
      className={`flex gap-2 ${className}`}
      role="radiogroup"
      aria-label="Select language"
    >
      {Object.keys(TRANSLATIONS).map((lang, index) => (
        <Button
          key={lang}
          ref={el => buttonRefs.current[index] = el}
          variant={currentLanguage === lang ? "default" : "outline"}
          size={size}
          onClick={() => onLanguageChange(lang)}
          onKeyDown={(e) => handleKeyDown(e, lang)}
          className={`language-selector ${currentLanguage === lang ? "ring-2 ring-primary ring-offset-2" : ""}`}
          aria-pressed={currentLanguage === lang}
          role="radio"
          tabIndex={currentLanguage === lang ? 0 : -1}
        >
          <span className="mr-2" aria-hidden="true">
            {TRANSLATIONS[lang].flag}
          </span>
          {TRANSLATIONS[lang].name}
        </Button>
      ))}
    </div>
  )
}