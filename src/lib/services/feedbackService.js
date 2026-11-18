import { api1 } from "../../baseUrl"
class FeedbackService {
  constructor() {
    this.API_BASE_URL = api1;
    // Record the timestamp when the service is instantiated (page load time).
    // Sent with every submission so the server can reject instant bot submissions.
    this.startedAt = Date.now();
  }

  async getActiveSurvey(rawLanguage = "en") {
    // Normalize "en-US" → "en", "am-ET" → "am", etc.
    const language = (rawLanguage || "en").split("-")[0].split("_")[0];
    try {
      // Request active survey for the specific language
      const response = await fetch(
        `${this.API_BASE_URL}/surveys?language=${language}&active=true&includeQuestions=true`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const surveys = await response.json();
      console.log(`[feedbackService] getActiveSurvey("${language}") → API returned ${surveys.length} survey(s):`, surveys);

      if (!Array.isArray(surveys) || surveys.length === 0) {
        console.warn(`[feedbackService] No surveys returned for language="${language}"`);
        return null;
      }

      // Trim trailing spaces from bpchar/character(n) DB columns before comparing.
      // Among all surveys matching the requested language, pick the one with the
      // most questions so that empty "Test Survey" stubs (questionCount === 0)
      // don't shadow the real survey.
      const matchingSurveys = surveys.filter(s => (s.language ?? "").trim() === language);
      const pool = matchingSurveys.length > 0 ? matchingSurveys : surveys; // fallback to all
      const languageSurvey = pool.reduce((best, s) =>
        (s.questionCount ?? 0) > (best.questionCount ?? 0) ? s : best
      , pool[0]);
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
      const payload = {
        ...responseData,
        // Anti-automation: timestamp of when the page/service was loaded.
        // The server rejects submissions that arrive in < 2 seconds.
        startedAt: this.startedAt,
        // Anti-automation: honeypot field — always empty for real users.
        // Bots that auto-fill all fields will populate this and be silently dropped.
        _hp: "",
      };

      const response = await fetch(`${this.API_BASE_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
