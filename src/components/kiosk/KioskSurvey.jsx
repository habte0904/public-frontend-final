"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { EmojiRating } from "./EmojiRating"
import { useFeedback } from "@/lib/hooks/useFeedback"
import { TRANSLATIONS } from "../../lib/constants/languages.js"
import { ChevronLeft, ChevronRight, SkipForward } from "lucide-react"

export function KioskSurvey({ language, onLanguageChange, onComplete }) {
  const { survey, loading, submitResponse } = useFeedback(language);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const t = TRANSLATIONS[language] || TRANSLATIONS.en || {};

  const currentQuestion = survey?.questions?.[currentQuestionIndex];
  const progress = survey?.questions ? ((currentQuestionIndex + 1) / survey.questions.length) * 100 : 0;

  const handleResponse = (value) => {
    if (!currentQuestion) return

    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }))
  }

  const handleSkip = () => {
    if (!survey?.questions) return

    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: "skipped",
    }))

    if (currentQuestionIndex < survey.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handleNext = () => {
    if (!survey?.questions) return

    if (currentQuestionIndex < survey.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      await submitResponse({
        surveyId: survey.id,
        responses,
        language,
        timestamp: new Date().toISOString(),
      })
      onComplete()
    } catch (error) {
      console.error("Failed to submit response:", error)
    }
  }

  useEffect(() => {
    if (currentQuestion) {
    }
  }, [currentQuestion]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading survey...</p>
        </div>
      </div>
    )
  }

  if (!survey || !survey.questions || survey.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Card className="max-w-md text-center bg-white border-gray-200 shadow-lg p-8">
          <p className="text-lg text-gray-600 mb-4">Survey not available</p>
          <Button onClick={() => window.location.reload()} className="bg-amber-600 hover:bg-amber-700">
            Reload
          </Button>
        </Card>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Card className="max-w-md text-center bg-white border-gray-200 shadow-lg p-8">
          <p className="text-lg text-gray-600 mb-4">Question not found</p>
          <Button onClick={handlePrevious} className="bg-amber-600 hover:bg-amber-700">
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  const questionText = currentQuestion.text || currentQuestion.question || ""
  const isLastQuestion = currentQuestionIndex === survey.questions.length - 1
  const hasResponse = responses[currentQuestion.id] !== undefined
  const isRequired = currentQuestion.required === true

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center p-8">
      <Card className="max-w-5xl w-full bg-white border-amber-500 shadow-2xl rounded-2xl overflow-hidden">
        <div className="p-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-2">
                {t.question || "Question"} {currentQuestionIndex + 1} {t.of || "of"} {survey.questions.length}
              </p>
              <Progress value={progress} className="w-40 h-2" />
            </div>
          </div>

          {/* Question */}
          <div className="mb-12">
            <h2 className="text-3xl font-semibold text-balance mb-8 text-center text-gray-900 leading-relaxed">
              {questionText}
            </h2>

            {!isRequired && (
              <div className="flex justify-center mb-8">
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-3">
                  <p className="text-sm text-amber-700 font-medium">This question is optional</p>
                </div>
              </div>
            )}

            {/* Answer Options */}
            <div className="space-y-6">
              {currentQuestion.type === "emoji-rating" && (
                <EmojiRating value={responses[currentQuestion.id]} onChange={handleResponse} language={language} />
              )}

              {currentQuestion.type === "multiple-choice" && (
                <div className="grid gap-4 max-w-3xl mx-auto">
                  {currentQuestion.options && currentQuestion.options.length > 0 ? (
                    currentQuestion.options.map((option, index) => {
                      const optionText = option.text || option.label || "";
                      const optionValue = option.value || option.id || "";
                      const isSelected = responses[currentQuestion.id] === optionValue;

                      return (
                        <Button
                          key={index}
                          variant={isSelected ? "default" : "outline"}
                          className={`text-left justify-start h-auto py-6 px-8 text-lg rounded-xl transition-all duration-300 ${
                            isSelected
                              ? "bg-gradient-to-r from-amber-400 to-amber-600 text-white ring-2 ring-amber-300 ring-offset-2 shadow-lg transform scale-105"
                              : "border-gray-300 text-gray-700 hover:border-amber-400 hover:bg-amber-50 hover:shadow-md"
                          }`}
                          onClick={() => handleResponse(optionValue)}
                        >
                          <span className="font-medium">{optionText}</span>
                        </Button>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-600">
                      <p>No options available for this question.</p>
                    </div>
                  )}
                </div>
              )}

              {(currentQuestion.type === "text" || currentQuestion.type === "yes-no") && (
                <div className="max-w-3xl mx-auto">
                  {currentQuestion.type === "yes-no" ? (
                    <div className="flex gap-6 justify-center">
                      <Button
                        variant={responses[currentQuestion.id] === "yes" ? "default" : "outline"}
                        className={`py-6 px-12 text-lg rounded-xl transition-all duration-300 ${
                          responses[currentQuestion.id] === "yes"
                            ? "bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg transform scale-105"
                            : "border-gray-300 text-gray-700 hover:border-amber-400 hover:bg-amber-50"
                        }`}
                        onClick={() => handleResponse("yes")}
                      >
                        {t.yes || "Yes"}
                      </Button>
                      <Button
                        variant={responses[currentQuestion.id] === "no" ? "default" : "outline"}
                        className={`py-6 px-12 text-lg rounded-xl transition-all duration-300 ${
                          responses[currentQuestion.id] === "no"
                            ? "bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg transform scale-105"
                            : "border-gray-300 text-gray-700 hover:border-amber-400 hover:bg-amber-50"
                        }`}
                        onClick={() => handleResponse("no")}
                      >
                        {t.no || "No"}
                      </Button>
                    </div>
                  ) : (
                    <textarea
                      className="w-full p-6 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-lg"
                      rows={5}
                      placeholder={t.textPlaceholder || "Please share your thoughts..."}
                      value={responses[currentQuestion.id] === "skipped" ? "" : responses[currentQuestion.id] || ""}
                      onChange={(e) => handleResponse(e.target.value)}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-8 border-t border-gray-200 gap-4 sm:gap-0 w-full">
            <div className="flex w-full sm:w-auto justify-center sm:justify-start">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="w-full sm:w-auto py-3 px-4 sm:py-4 sm:px-8 text-base sm:text-lg bg-transparent border-gray-300 text-gray-700 hover:border-amber-400 hover:bg-amber-50 rounded-xl"
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                {t.previous || "Previous"}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto justify-center sm:justify-end">
              {!isRequired && (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="w-full sm:w-auto py-3 px-4 sm:py-4 sm:px-8 text-base sm:text-lg border-gray-400 text-gray-600 hover:border-gray-500 hover:bg-gray-50 bg-transparent rounded-xl"
                >
                  <SkipForward className="h-5 w-5 mr-2" />
                  {t.skip}
                </Button>
              )}

              <Button
                onClick={handleNext}
                disabled={!hasResponse && isRequired}
                className="w-full sm:w-auto py-3 px-4 sm:py-4 sm:px-8 text-base sm:text-lg bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white rounded-xl shadow-lg"
              >
                {isLastQuestion ? t.submit || "Submit" : t.next || "Next"}
                {!isLastQuestion && <ChevronRight className="h-5 w-5 ml-2" />}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
