"use client"

import { Button } from "@/components/ui/button"
import { TRANSLATIONS } from "@/lib/constants/languages"
import { useRef } from "react" // Add this import

const EMOJI_RATINGS = [
  { value: 1, emoji: "😞", key: "veryDissatisfied" },
  { value: 2, emoji: "😕", key: "dissatisfied" },
  { value: 3, emoji: "😐", key: "neutral" },
  { value: 4, emoji: "😊", key: "satisfied" },
  { value: 5, emoji: "🤩", key: "verySatisfied" },
]

export function EmojiRating({ value, onChange, language = "en" }) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en
  const buttonRefs = useRef([])

  // Improve keyboard navigation
  const handleKeyDown = (event, ratingValue) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onChange(ratingValue)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      const nextIndex = Math.min(EMOJI_RATINGS.findIndex(r => r.value === ratingValue) + 1, EMOJI_RATINGS.length - 1)
      buttonRefs.current[nextIndex]?.focus()
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      const prevIndex = Math.max(EMOJI_RATINGS.findIndex(r => r.value === ratingValue) - 1, 0)
      buttonRefs.current[prevIndex]?.focus()
    }
  }

  return (
    <div 
      className="flex justify-center gap-4 flex-wrap"
      role="radiogroup"
      aria-label="Rate your experience"
    >
      {EMOJI_RATINGS.map((rating, index) => {
        const isSelected = value === rating.value
        const description = t.emojiRatings?.[rating.key] || rating.key

        return (
          <div key={rating.value} className="text-center">
            <Button
              ref={el => buttonRefs.current[index] = el}
              variant="ghost"
              className={`emoji-rating-button ${
                isSelected ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" : "hover:bg-muted"
              }`}
              onClick={() => onChange(rating.value)}
              onKeyDown={(e) => handleKeyDown(e, rating.value)}
              role="radio"
              aria-checked={isSelected}
              aria-label={`Rate ${rating.value} out of 5: ${description}`}
              tabIndex={isSelected ? 0 : -1}
            >
              <span className="text-4xl" role="img" aria-hidden="true">
                {rating.emoji}
              </span>
            </Button>
            {/* Ensure text is always visible with proper contrast */}
            <p className={`text-sm mt-2 font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
              {description}
            </p>
          </div>
        )
      })}
    </div>
  )
}