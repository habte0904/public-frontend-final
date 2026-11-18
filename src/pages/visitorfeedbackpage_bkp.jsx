"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import Navigation from "../components/navigation"
import Footer from "../components/footer"
import { KioskWelcome } from "../components/kiosk/KioskWelcome"
import { KioskSurvey } from "../components/kiosk/KioskSurvey"
import { KioskThankYou } from "../components/kiosk/KioskThankYou"

// In your main component (e.g., VisitorFeedbackpage), update the language change handler
const handleLanguageChange = (newLanguage) => {
  setLanguage(newLanguage);
  // Force a reload of the survey data for the new language
  // This will be handled by the useEffect in useFeedback
};

// In visitorfeedbackpage.jsx, make sure you're properly rendering the components
export default function VisitorFeedbackpage() {
  const [currentState, setCurrentState] = useState("survey")
  const { i18n } = useTranslation();
  const language = i18n.language;
  const [lang, setLang] = useState(i18n.language || "en");
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setLang(lng);
    localStorage.setItem("lang", lng); // ✅ save to localStorage
  };
   useEffect(() => {
    // load language from localStorage on mount
    const savedLang = localStorage.getItem("lang");
    if (savedLang && savedLang !== lang) {
      i18n.changeLanguage(savedLang);
      setLang(savedLang);
    }
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