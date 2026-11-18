import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users, ArrowRight, Star, ChevronLeft, ChevronRight, Check, User } from "lucide-react"
import { Advertisement } from "@/components/advertisement"
import { useLanguage } from "@/components/language-provider"
import { getAllContent } from "../services/contentManagementService"
import axios from "axios";
import { useTranslation } from 'react-i18next';

import { translateField } from "@/utils/translate";



import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import {api1,api2} from '../baseUrl.js'
const convertTo12Hour = (time24) => {
  if (!time24) return "";
  const [hour, minute] = time24.split(":").map(Number)
  const period = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`
}

const defaultHomeContent = {
  hero: {
    backgroundImage: "",
    title: "",
    motto: ""
  },
  about: {
    title: "",
    description: "",
    images: ["", "", "", ""]
  }
}

export default function HomePage() {
  //const { t } = useLanguage()
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const lang = i18n.language; 
  const [isVisible, setIsVisible] = useState(false)
  const [currentEventIndex, setCurrentEventIndex] = useState(0)
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const [homeContent, setHomeContent] = useState(defaultHomeContent);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

   function buildEndDate(dateStr, timeStr) {
  // Prefer parsing YYYY-MM-DD numerically to avoid UTC shift
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  let d;
  if (m) {
    d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])); // local date
  } else {
    d = new Date(dateStr); // fallback (e.g., already a Date or other format)
  }

  if (timeStr) {
    const [hh, mm = "0", ss = "0"] = timeStr.split(":");
    d.setHours(Number(hh) || 0, Number(mm) || 0, Number(ss) || 0, 0);
  } else {
    d.setHours(23, 59, 59, 999); // no end time => end of day
  }
  return d;
}
  // Filter events to only include upcoming ones
  const filterUpcomingEvents = (events) => {  
    
    return events.filter(event => {
       const end = buildEndDate(event.dateRaw ?? event.date, event.end_time);
      return end.getTime() >= Date.now();
    });
  }

  // Fetch events
  const fecthEvents = async() => {
    try {
      const res = await axios.get(`${api1}/events/userSide`)
      const filteredEvents = filterUpcomingEvents(res.data);
      setUpcomingEvents(filteredEvents)
    } catch (e) {
      console.error("Failed to fetch events:", e)
    } finally {
      setLoadingEvents(false);
    }
  }

  // Fetch all content on mount
  const fetchContent = async () => {
    try {
      const res = await getAllContent()
      const data = res.data;
      
      // Map backend data to frontend state
      setHomeContent({
        hero: {
          backgroundImage: data.pageContent?.find(x => x.page_name === "home" && x.section_name === "hero" && x.background_image)?.background_image
            ? data.pageContent?.find(x => x.page_name === "home" && x.section_name === "hero")?.background_image
            : "",
          title: data.pageContent?.find(x => x.page_name === "home" && x.section_name === "hero")?.title || "",
          motto: data.pageContent?.find(x => x.page_name === "home" && x.section_name === "hero")?.subtitle || "",
           title_am: data.pageContent?.find(x => x.page_name === "home" && x.section_name === "hero")?.title_am || "",
          motto_am: data.pageContent?.find(x => x.page_name === "home" && x.section_name === "hero")?.subtitle_am || "",
        },
        about: {
          title: data.pageContent?.find(x => x.page_name === "home" && x.section_name === "about_section")?.title || "",
          description: data.pageContent?.find(x => x.page_name === "home" && x.section_name === "about_section")?.content || "",
          title_am: data.pageContent?.find(x => x.page_name === "home" && x.section_name === "about_section")?.title_am || "",
          description_am: data.pageContent?.find(x => x.page_name === "home" && x.section_name === "about_section")?.content_am || "",
          images:
            data.imageGalleries?.filter(x => x.page_name === "home" && x.section_name === "about_images")?.length > 0
              ? data.imageGalleries
                  .filter(x => x.page_name === "home" && x.section_name === "about_images")
                  .sort((a, b) => a.display_order - b.display_order)
                  .map(x => x.file_url ? x.file_url : "")
              : ["", "", "", ""],
        },
      })
    } catch (err) {
      console.error("Failed to fetch content:", err);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [])

  useEffect(() => {
    // Fetch ticket types
    const fetchTicketTypes = async () => {
      try {
        const response = await fetch(`${api1}/tickets/types/front`);
        const data = await response.json();
        setTicketTypes(data);
      } catch (error) {
        console.error("Failed to fetch ticket types:", error);
      } finally {
        setLoadingTickets(false);
      }
    };

    fetchTicketTypes();
  }, []);

  useEffect(() => {
    fecthEvents();
  }, [])

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const nextEvent = () => {
    if (upcomingEvents.length > 0) {
      setCurrentEventIndex((prev) => (prev + 1) % upcomingEvents.length)
    }
  }

  const prevEvent = () => {
    if (upcomingEvents.length > 0) {
      setCurrentEventIndex((prev) => (prev - 1 + upcomingEvents.length) % upcomingEvents.length)
    }
  }

  const getVisibleEvents = () => {
    if (upcomingEvents.length === 0) return [];
    
    const events = []
    const maxEventsToShow = Math.min(3, upcomingEvents.length);
    
    for (let i = 0; i < maxEventsToShow; i++) {
      const index = (currentEventIndex + i) % upcomingEvents.length
      events.push(upcomingEvents[index])
    }
    return events
  }

  // Get first three ticket types
  const getFirstThreeTickets = () => {
    return ticketTypes.slice(0, 3);
  }

  // Get badge text based on ticket type
  const getTicketBadge = (index) => {
    if (index === 0) return "Most Popular";
    if (index === 2) return "Premium";
    return "";
  }

  // Get icon based on ticket type
  const getTicketIcon = (type) => {
    if (type.toLowerCase().includes("student") || type.toLowerCase().includes("kid")) {
      return <User className="w-8 h-8 text-amber-600" />;
    }
    if (type.toLowerCase().includes("premium")) {
      return <Star className="w-8 h-8 text-amber-600" />;
    }
    return <Users className="w-8 h-8 text-amber-600" />;
  }



  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <Navigation />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={homeContent.hero.backgroundImage}
            alt="Adwa Museum interior with traditional Ethiopian artifacts"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 via-transparent to-amber-900/30"></div>
        </div>

        <div className="relative z-10 container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div
              className={`transition-all duration-1000 delay-500 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}
            >
             <h1 className="font-light text-5xl lg:text-7xl xl:text-8xl mb-8 text-white leading-tight tracking-wide">
                {lang === "am" ? (
                  <>
                 
                    <span className="text-amber-400 block lg:inline">
                      {translateField(homeContent.hero, lang, "title")}
                    </span>{" "}
                    {translateField(homeContent.hero, lang, "motto")}
                  </>
                ) : (
                  <>
                    {translateField(homeContent.hero, lang, "motto")}{" "}
                    <span className="text-amber-400 block lg:inline">
                      {translateField(homeContent.hero, lang, "title")}
                    </span>
                  </>
                )}
              </h1>


              <div className="w-32 h-px bg-amber-400 mx-auto mb-8"></div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Button
                  className="bg-transparent border-2 border-amber-400 text-amber-400 hover:bg-amber-400/10 hover:border-amber-500 font-light px-12 py-4 text-lg tracking-wider transform hover:scale-105 transition-all duration-300"
                  asChild
                >
                  <Link to="/about">
                
                    {t("home.hero.learnMore")}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>

                <Button
                  className="bg-transparent border-2 border-white/80 text-white hover:bg-white/10 hover:border-white px-12 py-4 text-lg font-light tracking-wider transform hover:scale-105 transition-all duration-300"
                  asChild
                >
                  <Link to="/tickets"> {t("home.hero.buyTickets")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advertisement Banner */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Advertisement position="banner" />
        </div>
      </section>

      {/* Museum Introduction Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
              {translateField(homeContent.about, lang, "title")}
              </h2>
              <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
                 {translateField(homeContent.about, lang, "description")
                  .split('\r\n\r\n')
                  .map((para, i) => (
                    <p key={i}>{para}</p>
                ))}
              </div>
              <div className="mt-8">
                <Button size="lg" asChild className="bg-yellow-600 hover:bg-yellow-700">
                  <Link to="/about">{t("home.intro.learnMore")}</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-4">
                  {homeContent.about.images.slice(0, 2).map((image, i) => (
                    <div
                      key={i}
                      className={`relative ${i === 0 ? "h-48" : "h-32"} rounded-lg overflow-hidden`}
                    >
                      <img
                        src={image}
                        alt={`Home About Image ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>

                {/* Right Column */}
                <div className="space-y-4 mt-8">
                  {homeContent.about.images.slice(2, 4).map((image, i) => (
                    <div
                      key={i}
                      className={`relative ${i === 0? "h-32" : "h-48"} rounded-lg overflow-hidden`}
                    >
                      <img
                        src={image}
                        alt={`Home About Image ${i + 3}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Carousel Section - Only show if events exist */}
      {!loadingEvents && upcomingEvents.length > 0 && (
        <section className="py-32 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-light text-4xl lg:text-5xl text-gray-900 mb-4">{t("home.events.title")}</h2>
              <div className="w-24 h-px bg-amber-400 mx-auto mb-6"></div>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto font-light">
                {t("home.events.description")}
              </p>
            </div>

            {/* Carousel Container */}
            <div className="relative">
              {/* Navigation Buttons - Only show if there are more than 3 events */}
              {upcomingEvents.length > 3 && (
                <>
                  <Button
                    onClick={prevEvent}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 z-10 bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 text-amber-400 w-12 h-12 rounded-full p-0"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>

                  <Button
                    onClick={nextEvent}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 z-10 bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 text-amber-400 w-12 h-12 rounded-full p-0"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}

              {/* Events Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {getVisibleEvents().map((event, index) => (
                  <Card
                    key={`${event.id}-${currentEventIndex}`}
                    className={`overflow-hidden bg-white border-gray-200  hover:border-amber-400/50 backdrop-blur-sm transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/10 group ${
                      event.featured ? "ring-2 ring-amber-500/30" : ""
                    } ${index === 1 && upcomingEvents.length > 3 ? "transform scale-105" : ""}`}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={`${api2}/${event.image}` || "/placeholder.svg"}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <Badge className="bg-amber-500 text-white border-amber-500/30 font-light">{translateField(event, lang, "category")}</Badge>
                        {event.featured && (
                          <Badge className="bg-amber-500 text-white border-amber-500/30 font-light">
                            <Star className="w-3 h-3 mr-1" />
                            {t("home.events.featured")}
                          </Badge>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    <CardHeader>
                      <CardTitle className="text-gray-900 group-hover:text-amber-400 transition-colors duration-300 text-lg font-light">
                       {translateField(event, lang, "title")}
                      </CardTitle>
                      <CardDescription className="text-gray-400 line-clamp-2 text-sm font-light">
                        {translateField(event, lang, "description")}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm font-light">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 text-amber-500 mr-2" />
                          {event.date}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 text-amber-500 mr-2" />
                          {convertTo12Hour(event.start_time)} - {convertTo12Hour(event.end_time)}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 text-amber-500 mr-2" />
                       {translateField(event, lang, "location")}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Users className="w-4 h-4 text-amber-500 mr-2" />
                          {event.capacity} {t("home.events.attending")}
                        </div>
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-light transform hover:scale-105 transition-all duration-300 group">
                            {t("home.hero.learnMore")}
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white border-yellow-500/30 text-white max-w-2xl max-h-[80vh] overflow-y-auto backdrop-blur-md">
                          <DialogHeader>
                            <DialogTitle className="text-2xl text-gray-900">
                              {translateField(event, lang, "title")}
                            </DialogTitle>
                            <DialogDescription className="text-gray-600">{translateField(event, lang, "fullDescription")  ||translateField(event, lang, "description")}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center text-gray-600">
                                <Calendar className="w-4 h-4 text-yellow-400 mr-2" />
                                {event.date}
                              </div>
                              <div className="flex items-center text-gray-600">
                                <Clock className="w-4 h-4 text-yellow-400 mr-2" />
                                {convertTo12Hour(event.start_time)}-{convertTo12Hour(event.end_time)}
                              </div>
                              <div className="flex items-center text-gray-600">
                                <MapPin className="w-4 h-4 text-yellow-400 mr-2" />
                                {translateField(event, lang, "location")}
                              </div>
                              <div className="flex items-center text-gray-600">
                                <Users className="w-4 h-4 text-yellow-400 mr-2" />
                                {event.registered}/{event.capacity} {t("home.events.registered")}
                              </div>
                            </div>
                            {!(buildEndDate(event.dateRaw ?? event.date, event.end_time).getTime() < Date.now()) ? (
                              <div className="flex gap-4 pt-4">
                                <Button
                                  className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold"
                                  asChild
                                >
                                  <Link to={`/events/${event.id}/tickets`}>{t("home.events.registerNow")}</Link>
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Carousel Indicators - Only show if there are more than 3 events */}
              {upcomingEvents.length > 3 && (
                <div className="flex justify-center space-x-2 mb-8">
                  {upcomingEvents.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentEventIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentEventIndex ? "bg-amber-400" : "bg-amber-400/30"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="text-center">
              <Button
                className="bg-transparent border-2 border-amber-400 text-gray-600 hover:bg-amber-400/10 hover:border-amber-500 px-12 py-4 text-lg font-light tracking-widest transition-all duration-300"
                asChild
              >
                <Link to="/events">{t("home.events.viewEvents")}</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Show message if no upcoming events */}
      {!loadingEvents && upcomingEvents.length === 0 && (
        <section className="py-32 bg-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="font-light text-4xl lg:text-5xl text-gray-900 mb-4">{t("home.events.title")}</h2>
            <div className="w-24 h-px bg-amber-400 mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto font-light">
              {t("home.events.checkBack")}
            </p>
          </div>
        </section>
      )}

      {/* Show loading state while events are being fetched */}
      {loadingEvents && (
        <section className="py-32 bg-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="font-light text-4xl lg:text-5xl text-gray-900 mb-4">{t("home.events.loadEvents")}</h2>
          </div>
        </section>
      )}

      {/* Quick Ticket Purchase Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">{t("home.tickets.title")}</h2>
              <p className="text-xl text-gray-600">{t("home.tickets.choose")}</p>
            </div>
            
            {loadingTickets ? (
              <div className="text-center py-12">
                <p className="text-gray-600">{t("home.tickets.loadTickets")}</p>
              </div>
            ) : ticketTypes.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-8">
                {getFirstThreeTickets().map((ticket, index) => (
                  <Card 
                    key={ticket.ticket_id} 
                    className={`text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white border-gray-200 hover:border-amber-400/50 ${
                      index === 1 ? "ring-2 ring-amber-200" : ""
                    }`}
                  >
                    <CardHeader className="pb-4">
                    
                      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        {getTicketIcon(ticket.type)}
                      </div>
                      <CardTitle className="text-2xl text-gray-900">{translateField(ticket, lang, "type")}</CardTitle>
                      <CardDescription className="text-gray-600">
                        {translateField(ticket, lang, "description")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold text-amber-600 mb-8">{ticket.price} {
                        ticket.currency==="USD"? t("currency.currencyUSD"):t("currency.currencyETB")
                        }</div>
                      <ul className="space-y-3 text-sm text-gray-600 font-light mb-6">
                        {ticket.feature && ticket.feature.split(',').map((feature, i) => (
                          <li key={i} className="flex items-center justify-center">
                            <Check className="w-4 h-4 text-amber-600 mr-3" />
                            {/*feature.trim()*/} {translateField(ticket, lang, "feature").trim()}
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full bg-amber-600 hover:bg-amber-700 py-3 text-white font-medium" asChild>
                        <Link to={`/tickets?type=${ticket.type.toLowerCase()}`}>
                          {t("home.tickets.purchaseNow")}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">{t("home.tickets.noTickets")}</p>
              </div>
            )}

            {/* Additional Options */}
            <div className="text-center mt-12">
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-8 py-4 text-lg bg-transparent"
                  asChild
                >
                  <Link to="/contact">{t("home.tickets.contactUs")}</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-amber-400 text-amber-600 hover:bg-amber-50 hover:border-amber-500 px-8 py-4 text-lg bg-transparent"
                  asChild
                >
                  <Link to="/tickets">{t("home.tickets.viewTickets")}</Link>
                </Button>
              </div>
             
            </div>
          </div>
        </div>
      </section>

      {/* Footer Advertisement */}
      <section className="py-8 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Advertisement position="footer" />
        </div>
      </section>

      <Footer />
    </div>
  )
}