"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LanguageSelector } from "./LanguageSelector"
import { TRANSLATIONS } from "../../lib/constants/languages"
import { Star, Sparkles, Heart, MessageSquare } from "lucide-react"

export function KioskWelcome({ language, onLanguageChange, onStartSurvey }) {
  const t = TRANSLATIONS[language]

  const handleStartSurvey = () => {
    onStartSurvey()
  }

  const handleLanguageChange = (newLanguage) => {
    onLanguageChange(newLanguage)
  }

  const interactiveFeatures = [
    {
      icon: Star,
      title: "Rate Your Experience",
      description: "Encourage users to share their thoughts about their museum visit to help us improve",
      color: "from-amber-400 to-amber-600",
    },
    {
      icon: Heart,
      title: "What Inspired You?",
      description: "Invite visitors to describe the exhibits that moved them the most",
      color: "from-red-400 to-red-600",
    },
    {
      icon: MessageSquare,
      title: "Leave Your Story",
      description: "Provide a space for users to share how this visit connected them to Ethiopian heritage",
      color: "from-blue-400 to-blue-600",
    },
    {
      icon: Sparkles,
      title: "Suggest Improvements",
      description: "Emphasize that their ideas are valuable in creating even better experiences",
      color: "from-purple-400 to-purple-600",
    },
  ]

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 md:p-8">
      <Card className="max-w-5xl w-full text-center bg-white/95 backdrop-blur-sm border-amber-500 shadow-2xl rounded-2xl overflow-hidden">
        <div className="bg-whithe p-8 text-gray-900">
          <div className="w-20 h-20 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
            <span className="text-3xl" aria-hidden="true">
              🏛️
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-balance mb-4">{t.welcome}</h1>
          <p className="text-xl md:text-2xl text-white/90 text-balance mb-2">{t.subtitle}</p>
          <p className="text-lg font-medium bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 inline-block">
            Adwa Museum Visitor Feedback
          </p>
        </div>

        <div className="p-8">
          <div className="mb-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {interactiveFeatures.map((feature, index) => (
              <div
                key={index}
                className="group text-center p-6 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg bg-gradient-to-br ${feature.color}`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mb-8">
            <p id="language-label" className="text-lg font-semibold text-gray-700 mb-4">
              {t.selectLanguage}
            </p>
            <LanguageSelector
              currentLanguage={language}
              onLanguageChange={handleLanguageChange}
              className="justify-center"
              aria-labelledby="language-label"
            />
          </div>

          <div className="mb-8">
            <Button
              onClick={handleStartSurvey}
              size="lg"
              className="w-full max-w-md mx-auto bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white font-bold py-6 px-8 text-xl rounded-xl transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              aria-describedby="start-description"
            >
              <span className="mr-3 text-2xl" aria-hidden="true">
                📝
              </span>
              {t.startSurvey}
            </Button>
            <p id="start-description" className="sr-only">
              Start the feedback survey to share your museum experience
            </p>
          </div>

          <div className="pt-8 border-t-2 border-amber-200">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-1">
              <p className="text-base font-medium text-gray-800 mb-2">
                Your feedback helps shape the future of the Adwa Museum.
              </p>
              <p className="text-sm text-gray-600">
                It's quick, easy, and helps us preserve and share Ethiopian history and culture.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}