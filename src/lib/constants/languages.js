// Minimal translations and speech-language mappings used by the kiosk components.
// Extend or replace these values with real translations as needed.

export const SPEECH_LANGUAGE_CODES = {
  // keys are the language keys used in the app (e.g. 'en', 'am')
  // values are the BCP-47 language tags used by the Web Speech API
  en: "en-US",
  am: "am-ET",
}

// In languages.js, make sure English has the emojiRatings defined
export const TRANSLATIONS = {
  en: {
    // Language selector
    flag: "🇺🇸",
    name: "English",

    // Welcome screen
    welcome: "Welcome",
    subtitle: "Please take a moment to share your experience.",
    selectLanguage: "Select your language",
    startSurvey: "Start Survey",
    listen: "Listen",

    // Survey (labels & navigation)
    question: "Question",
    of: "of",
    yes: "Yes",
    no: "No",
    textPlaceholder: "Please share your thoughts...",
    previous: "Previous",
    next: "Next",
    submit: "Submit",
    skip:"Skip",

    // Emoji ratings - make sure these are defined
    emojiRatings: {
      veryDissatisfied: "Very dissatisfied",
      dissatisfied: "Dissatisfied", 
      neutral: "Neutral",
      satisfied: "Satisfied",
      verySatisfied: "Very satisfied",
    },

    // Thank you / finish
    thankYou: "Thank you!",
    adwa:"Adwa Victory Memorial",
    returnHome:"return home",
    feedbackReceived: "Your feedback has been received.",
    appreciateTime: "We appreciate you taking the time to help us improve.",
    newSurvey: "Start new survey",
    autoRestart: "This kiosk will return to the welcome screen automatically.",
  },

  // Example Amharic translations (basic) — replace with reviewed translations if available
  am: {
    flag: "🇪🇹",
    name: "አማርኛ",

    welcome: "እንኳን ደህና መጡ",
    subtitle: "እባክዎን በጥቂት ደቂቃዎች ውስጥ ማስተያየት ይስጡ",
    selectLanguage: "ቋንቋ ይምረጡ",
    startSurvey: "ጥያቄዎችን ጀምር",
    listen: "ይስማ",

    question: "ጥያቄ",
    of: "ከ",
    yes: "አዎ",
    no: "አይ",
    textPlaceholder: "እባክዎን ሃሳቦትን ያስቀምጡ...",
    previous: "ያለፈ",
    next: "ቀጣይ",
    submit: "አስገባ",
    skip:"ይለፉ",

    emojiRatings: {
      veryDissatisfied: "በጣም የተሳካ አይደለም",
      dissatisfied: "የተሳካ አይደለም",
      neutral: "ግምት",
      satisfied: "የተሳካ",
      verySatisfied: "በጣም የተሳካ",
    },

    thankYou: "እናመሰግናለን!",
    adwa:"የ አድዋ ድል መታስብያ",
    returnHome:"ወደ መነሻ ገጽ",
    feedbackReceived: "እውነተኛ አስተያየትዎ ተቀብሏል.",
    appreciateTime: "ለጊዜዎ እናመሰግናለን።",
    newSurvey: "አዲስ ጥያቄ ጀምር",
    autoRestart: "ይህ ኪዮስክ በራሱ ወደ እንኳን ማስታወቂያ ይመለሳል።",
  },
}

// Default export for convenience (some imports may use default or named)
export default TRANSLATIONS
