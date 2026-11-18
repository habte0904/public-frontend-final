"use client"

import { useState, useEffect } from "react"
import { feedbackService } from "@/lib/services/feedbackService"

export function useFeedback(language = "en") {
  const [survey, setSurvey] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log("🔍 [DEBUG] useFeedback hook initialized with language:", language);
    loadSurvey(language)
  }, [language])

  const loadSurvey = async (lang) => {
    try {
      console.log("🔍 [DEBUG] Loading survey for language:", lang);
      setLoading(true);
      setError(null);

      const activeSurvey = await feedbackService.getActiveSurvey(lang);
      console.log("🔍 [DEBUG] Loaded survey:", activeSurvey);
      
      if (activeSurvey) {
        setSurvey(activeSurvey);
      } else {
        console.error("❌ [ERROR] No active survey found for language:", lang);
        setError("No active survey found");
        setSurvey(null);
      }
    } catch (err) {
      console.error("❌ [ERROR] Failed to load survey:", err);
      setError("Failed to load survey");
      setSurvey(null);
    } finally {
      setLoading(false);
    }
  };

  const submitResponse = async (responseData) => {
    try {
      if (!survey) throw new Error("No survey available")

      const formattedAnswers = Object.entries(responseData.responses).map(([questionId, answer]) => {
        const question = survey.questions.find(q => q.id == questionId);
        let type = "text";
        
        if (question) {
          if (question.type === "emoji-rating") type = "number";
          else if (question.type === "multiple-choice") type = "single_choice";
          else if (question.type === "yes-no") type = "boolean";
          else type = question.type;
        }

        return {
          questionId,
          type,
          value: answer
        };
      })

      const feedbackRequest = {
        surveyId: responseData.surveyId,
        answers: formattedAnswers,
        language: responseData.language,
        sessionId: responseData.sessionId || `session_${Date.now()}`
      }

      await feedbackService.submitFeedback(feedbackRequest)
      return true
    } catch (err) {
      console.error("Failed to submit response:", err)
      return false
    }
  }

  return { 
    survey, 
    loading, 
    error, 
    submitResponse 
  }
}