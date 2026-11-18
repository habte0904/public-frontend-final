import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./index.css"; // make sure your font CSS is loaded

function AppWrapper({ children }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    const html = document.documentElement;

    // remove old font classes
    html.classList.remove("font-garamond", "font-ethiopic");

    // add new font class based on current language
    if (i18n.language === "am") {
      html.classList.add("font-ethiopic");
    } else {
      html.classList.add("font-garamond");
    }
  }, [i18n.language]);

  return <>{children}</>;
}

export default AppWrapper;
