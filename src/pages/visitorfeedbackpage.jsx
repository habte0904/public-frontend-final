"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import Navigation from "../components/navigation"
import { KioskWelcome } from "../components/kiosk/KioskWelcome"
import { KioskSurvey } from "../components/kiosk/KioskSurvey"
import { KioskThankYou } from "../components/kiosk/KioskThankYou"

// Normalize locale codes like "en-US" → "en", "am-ET" → "am"
const normalizeLanguage = (lng) => (lng || "en").split("-")[0].split("_")[0];

// In visitorfeedbackpage.jsx, make sure you're properly rendering the components
export default function VisitorFeedbackpage() {
  const [currentState, setCurrentState] = useState("survey")
  const { i18n } = useTranslation();

  // Reactive language state — normalized to "en" or "am" (strips locale suffixes)
  const [language, setLanguage] = useState(() => normalizeLanguage(i18n.language));

  useEffect(() => {
    // Sync on mount from localStorage in case Navigation already set it
    const savedLang = localStorage.getItem("lang");
    if (savedLang) {
      const normalized = normalizeLanguage(savedLang);
      console.log("saved lang",savedLang);
      if (normalized !== language) setLanguage(normalized);
      console.log("normalized");
    }

    // Listen to i18n language changes triggered by the Navigation component
    const onLanguageChanged = (lng) => {
      console.log("languaged changed to ",lng);
      setLanguage(normalizeLanguage(lng));
    };
    i18n.on("languageChanged", onLanguageChanged);
    return () => i18n.off("languageChanged", onLanguageChanged);
  }, []);

  const handleStartSurvey = () => {
    setCurrentState("survey")
  }

  const handleSurveyComplete = () => {
    setCurrentState("thank-you")
  }

  const handleRestart = () => {
    setCurrentState("survey")
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-amber-400 text-black px-4 py-2 rounded-md font-medium transition-all duration-200 hover:bg-amber-500"
      >
        Skip to main content
      </a>

      <Navigation />

      <main id="main-content" className="pt-20 min-h-screen bg-gradient-to-br from-white via-gray-50 to-white">
        {currentState === "welcome" && (
          <KioskWelcome onStartSurvey={handleStartSurvey} language={language} />
        )}

        {currentState === "survey" && (
          <KioskSurvey onComplete={handleSurveyComplete} language={language} />
        )}

        {currentState === "thank-you" && <KioskThankYou onRestart={handleRestart} language={language} />}
      </main>

    </div>
  )
}
