import { api1 } from "../../baseUrl"
class FeedbackService {
  constructor() {
    this.API_BASE_URL = api1;
  }

  // In feedbackService.js, update getActiveSurvey
  async getActiveSurvey(language = "en") {
    try {
      // Request active survey for the specific language
      const response = await fetch(
        `${this.API_BASE_URL}/surveys?language=${language}&active=true&includeQuestions=true`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const surveys = await response.json();
      
      // Return the first active survey for the requested language
      const languageSurvey = surveys.find(s => s.language === language);
      return languageSurvey || null;
    } catch (error) {
      console.error("Failed to fetch active survey:", error);
      
      // Return appropriate mock survey based on language
      console.log("Using mock survey data for debugging");
      if (language === "am") {
        return {
          id: 2,
          title: "የአድዋ ሙዚየም የተጎብኙት አስተያየት",
          description: "ከሙዚየም ተጎብኝተው የሚመጡትን አስተያየት ለመሰብሰብ",
          language: "am",
          isActive: true,
          questions: [
            {
              id: 6,
              text: "የዛሬው ጉብኝትዎን በአጠቃላይ እንዴት ይገምታሉ?",
              type: "emoji-rating",
              required: true,
              order: 1,
              options: []
            }
          ]
        };
      } else {
        return {
          id: 1,
          title: "Adwa Museum Visitor Feedback",
          description: "Collect feedback from museum visitors",
          language: "en",
          isActive: true,
          questions: [
            {
              id: 1,
              text: "How would you rate your experience?",
              type: "emoji-rating",
              required: true,
              order: 1,
              options: []
            }
          ]
        };
      }
    }
  }

  // ... existing code ...

  async submitFeedback(responseData) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(responseData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      throw error;
    }
  }

  async debugApiCalls() {
    try {
      console.log("Testing API endpoints...");
      
      // Test the surveys endpoint
      const surveysUrl = `${this.API_BASE_URL}/surveys`;
      console.log("Testing surveys endpoint:", surveysUrl);
      const surveysResponse = await fetch(surveysUrl);
      console.log("Surveys endpoint status:", surveysResponse.status);
      
      // Test the health endpoint
      const healthUrl = `${this.API_BASE_URL}/health`;
      console.log("Testing health endpoint:", healthUrl);
      const healthResponse = await fetch(healthUrl);
      console.log("Health endpoint status:", healthResponse.status);
      
      return {
        surveys: surveysResponse.status,
        health: healthResponse.status
      };
    } catch (error) {
      console.error("API debug failed:", error);
      throw error;
    }
  }
}

export const feedbackService = new FeedbackService();