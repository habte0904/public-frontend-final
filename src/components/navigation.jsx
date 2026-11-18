"use client"
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, MapPin, Clock, Users } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import UserAvatar from "@/components/user-avatar"


export default function Navigation() {

  const { i18n, t } = useTranslation();
  const [lang, setLang] = useState(i18n.language || "en");
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()
  const pathname = location.pathname
  const { isAuthenticated, signOut } = useAuth()
  

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



  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Scroll to top when pathname changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [pathname])

  const handleNavigation = () => {
    setIsOpen(false)
    // Scroll to top will be handled by the useEffect above
  }

 const navItems = [
  { href: "/", key: "home" },
  { href: "/about", key: "about" },
  { href: "/exhibitions", key: "exhibitions" },
  { href: "/events", key: "events" },
  { href: "/services", key: "services" },
  { href: "/contact", key: "contact" },
  { href: "/news", key:"News"},
  { href: "/visitor-feedback", key: "feedback" },
];


  // Add Sign In to nav items only if not authenticated
  if (!isAuthenticated) {
  navItems.push({ href: "/signin", key: "signin" });
}


  // Check if we're on the home page for transparent navigation
  const isHomePage = pathname === "/"

  function LanguageToggle({ lang, changeLanguage }) {
  const languages = [
    { code: "en", label: "EN" },
    { code: "am", label: "አማ" },
  ];
  
  return (
    <div className="flex items-center border border-amber-400 rounded-full overflow-hidden">
      {languages.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => changeLanguage(code)}
          className={`px-3 py-1 text-xs font-semibold transition-colors ${
            lang === code
              ? "bg-amber-400 text-black"
              : "bg-black text-amber-400 hover:bg-amber-400/20"
          }`}
          aria-label={`Switch to ${label}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}


return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 shadow-lg ${
        isHomePage
          ? isScrolled
            ? "bg-black/95 backdrop-blur-md border-b border-amber-400/20 shadow-xl"
            : "bg-transparent"
          : isScrolled
            ? "bg-black/95 backdrop-blur-md border-b border-amber-400/20 shadow-xl"
            : "bg-black"
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3" onClick={handleNavigation}>
            <div className="w-12 h-12 relative">
              <img src="/images/adwa-logo.svg" alt="Adwa Museum Logo" className="object-contain w-full h-full" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white">{t("nav.museum_name")}</h1>
              <p className="text-xs text-amber-400">{t("nav.heritage_history")}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-sm font-medium transition-colors duration-200 hover:text-amber-400 ${
                  pathname === item.href ? "text-amber-400" : "text-white"
                }`}
                onClick={handleNavigation}
              >
                 {t(`nav.${item.key}`)}
              </Link>
            ))}
          </div>

          {/* CTA Buttons / User Avatar / Language Toggle */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Language Toggle */}
            <div className="flex items-center border border-amber-400 rounded-full overflow-hidden">
              <button
                onClick={() => changeLanguage("en")}
                className={`px-3 py-1 text-xs font-semibold transition-colors duration-200 focus:outline-none ${
                  lang === "en"
                    ? "bg-amber-400 text-black"
                    : "bg-black text-amber-400 hover:bg-amber-400/20"
                }`}
                aria-label="Switch to English"
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage("am")}
                className={`px-3 py-1 text-xs font-semibold transition-colors duration-200 focus:outline-none ${
                  lang === "am"
                    ? "bg-amber-400 text-black"
                    : "bg-black text-amber-400 hover:bg-amber-400/20"
                }`}
                aria-label="Switch to Amharic"
              >
                አማ
              </button>
            </div>
            {/* ...existing code for CTA/User... */}
            {isAuthenticated ? (
              <>
                <Button
                  variant="outline"
                  className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black transition-all duration-200 bg-transparent"
                  asChild
                >
                <Link to="/tickets" onClick={handleNavigation}>
                    {t("nav.bookTicket")}
                </Link>
                </Button>
                <UserAvatar />
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black transition-all duration-200 bg-transparent"
                  asChild
                >
                  <Link to="/tickets" onClick={handleNavigation}>
                    {t("nav.bookTicket")}
                  </Link>
                </Button>
                
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-white hover:text-amber-400">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-black border-l border-amber-400/20">
              <div className="flex flex-col h-full overflow-y-auto max-h-screen">
                {/* Mobile Logo */}
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-10 h-10 relative">
                    <img src="/images/adwa-logo.svg" alt="Adwa Museum Logo" className="object-contain w-full h-full" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">{t("nav.museum_name")}</h1>
                    <p className="text-xs text-amber-400">{t("nav.heritage_history")}</p>
                  </div>
                </div>

                {/* Mobile Navigation */}
                <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 mb-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`text-base font-medium transition-colors duration-200 hover:text-amber-400 py-2 ${
                        pathname === item.href ? "text-amber-400" : "text-white"
                      }`}
                      onClick={handleNavigation}
                    >
                      {t(`nav.${item.key}`)}
                    </Link>
                  ))}
                </div>

                {/* Mobile Language Toggle (moved above Book Tickets) */}
                <div className="flex justify-center mb-3">
                  <div className="flex items-center border border-amber-400 rounded-full overflow-hidden">
                    <button
                      onClick={() => changeLanguage("en")}
                      className={`px-3 py-1 text-xs font-semibold transition-colors duration-200 focus:outline-none ${
                        lang === "en"
                          ? "bg-amber-400 text-black"
                          : "bg-black text-amber-400 hover:bg-amber-400/20"
                      }`}
                      aria-label="Switch to English"
                    >
                      EN
                    </button>
                    <button
                      onClick={() => changeLanguage("am")}
                      className={`px-3 py-1 text-xs font-semibold transition-colors duration-200 focus:outline-none ${
                        lang === "am"
                          ? "bg-amber-400 text-black"
                          : "bg-black text-amber-400 hover:bg-amber-400/20"
                      }`}
                      aria-label="Switch to Amharic"
                    >
                      አማ
                    </button>
                  </div>
                </div>

                {/* Mobile CTA */}
                <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 mt-2 mb-2">
                  {isAuthenticated && (
                    <div className="flex justify-center">
                      <UserAvatar />
                    </div>
                  )}
                  <Button className="w-full bg-amber-400 text-black hover:bg-amber-500" asChild>
                    <Link to="/tickets" onClick={handleNavigation}>
                      {t("nav.bookTicket")}
                    </Link>
                  </Button>

                  {isAuthenticated && (
                    <Button
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => {
                        signOut();
                        handleNavigation();
                      }}
                    >
                      {t("nav.logOut")}
                    </Button>
                  )}
                </div>
                
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
