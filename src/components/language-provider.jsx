"use client"

import { createContext, useContext, useState } from "react"

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("en")

  const translations = {
    en: {
      "intro.title": "A Living Testament to Ethiopian Glory",
      "intro.p1":
        "Step into the Adwa Museum and embark on an extraordinary journey through one of Africa's most significant historical moments. Our museum stands as a beacon of Ethiopian pride, commemorating the decisive victory at the Battle of Adwa in 1896 that secured Ethiopia's sovereignty and inspired liberation movements across the continent.",
      "intro.p2":
        "Through cutting-edge technology, authentic artifacts, and immersive storytelling, we bring to life the courage, strategy, and unity that defined this pivotal moment in world history. Our exhibitions showcase not just a military victory, but a triumph of African resistance against colonialism that resonated globally.",
      "intro.p3":
        "Beyond our historical exhibitions, the Adwa Museum serves as a vibrant cultural center, hosting educational programs, research initiatives, and community events that connect past achievements with present aspirations and future possibilities.",
      "intro.learnMore": "Learn More About Us",
    },
    am: {
      "intro.title": "የኢትዮጵያ ክብር ህያው ምስክር",
      "intro.p1":
        "ወደ አድዋ ሙዚየም ይግቡ እና በአፍሪካ በጣም ጠቃሚ ከሆኑ ታሪካዊ ጊዜያት አንዱ በኩል ያልተለመደ ጉዞ ይጀምሩ። ሙዚየማችን የኢትዮጵያ ኩራት መብራት ሆኖ ቆሞ፣ በ1896 በአድዋ ጦርነት የተገኘውን ወሳኝ ድል በማስታወስ የኢትዮጵያን ሉዓላዊነት ያረጋገጠ እና በአህጉሩ ላይ የነፃነት እንቅስቃሴዎችን ያነሳሳ ነው።",
      "intro.p2":
        "በዘመናዊ ቴክኖሎጂ፣ በትክክለኛ ቅርሶች እና በሚያስደንቅ ታሪክ ተረት፣ በዓለም ታሪክ ውስጥ ይህንን ወሳኝ ጊዜ የገለጸውን ድፍረት፣ ስትራቴጂ እና አንድነት ወደ ህይወት እናመጣለን። የእኛ ኤግዚቢሽኖች ወታደራዊ ድል ብቻ ሳይሆን በዓለም አቀፍ ደረጃ የተሰማውን ኮሎኒያሊዝምን የመቃወም የአፍሪካ ድል ያሳያሉ።",
      "intro.p3":
        "የእኛ ኤግዚቢሽኖች በላይ፣ አድዋ ሙዚየም እንደ ደማቅ ባህላዊ ማዕከል ሆኖ ያገለግላል፣ ያለፉትን ስኬቶች ከአሁኑ ምኞቶች እና ከወደፊቱ እድሎች ጋር የሚያገናኙ የትምህርት ፕሮግራሞችን፣ የምርምር ተነሳሽነቶችን እና የማህበረሰብ ዝግጅቶችን ያስተናግዳል።",
      "intro.learnMore": "ስለ እኛ ተጨማሪ ይወቁ",
    },
  }

  const t = (key, defaultEn, defaultAm) => {
    if (language === "am" && defaultAm) {
      return defaultAm
    }
    return translations[language]?.[key] || defaultEn || key
  }

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "am" : "en"))
  }

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
