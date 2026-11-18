"use client"

import { useState, useEffect } from "react"
import Navigation from "../components/navigation"
import Footer from "../components/footer"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Badge } from "../components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog"
import { Calendar, Clock, MapPin, Users, Search, Filter, ChevronRight, Star } from "lucide-react"
import { Link } from "react-router-dom"
import { Advertisement } from "../components/advertisement"
import { useLanguage } from "../components/language-provider"
import axios from "axios"
import { useTranslation } from 'react-i18next';
import { api1, api2 } from "../baseUrl"
import { translateField } from "@/utils/translate";
import { formatEthiopian, formatEthiopianTime } from "@/utils/ethiopianDate";
const convertTo12Hour = (time24) => {
  const [hour, minute] = time24.split(":").map(Number)
  const period = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`
}

export default function EventsPage() {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const lang = i18n.language; 
  
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("upcoming")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isVisible, setIsVisible] = useState(false)
  const [events, setEvents] = useState([]);

  useEffect(() => {
    setIsVisible(true)
  }, [])

   // Fetch events
  const fecthEvents = async()=>{

     try {
      const res = await axios.get(`${api1}/events/userSide`)
      setEvents(res.data)
    } catch (e) {
      console.error("Failed to fetch events:", e)
    }

  }

useEffect(()=>{
  fecthEvents();
},[])

  const categories = [
  "all",
  ...Array.from(
    new Set(
      events.map((event) => translateField(event, lang,"category")).filter(Boolean)
    )
  ).sort()
];


  //const typeOptions = ["all", "Free", "Paid", "Featured"]
  // Options array (values match your i18n keys)
const typeOptions = ["all", "free", "paid", "featured"];

// helper that is timezone-safe for YYYY-MM-DD and sets time
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

  const filteredEvents = events.filter((event) => {
    // Search filter
    const matchesSearch =
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase());

    // Category filter (compare translated value)
    const eventCategoryTranslated = translateField(event, lang, "category");
    const matchesCategory = categoryFilter === "all" || eventCategoryTranslated === categoryFilter;

    // Type filter
    let matchesType = true;
    if (typeFilter === "Featured") {
      matchesType = !!event.featured;
    } else if (typeFilter !== "all") {
      matchesType = event.type === typeFilter;
    }

    // Date filter
    let matchesDate = true;
    if (dateFilter === "upcoming") {
      // Show events with date in the future
      //const eventDate = new Date(event.date);
      const end = buildEndDate(event.dateRaw ?? event.date, event.end_time);
      matchesDate = end.getTime() >= Date.now();
    } else if (dateFilter === "this-month") {
      const eventDate = new Date(event.date);
      const now = new Date();
      matchesDate =
        eventDate.getMonth() === now.getMonth() &&
        eventDate.getFullYear() === now.getFullYear();
    } else if (dateFilter === "past") {
      const end = buildEndDate(event.dateRaw ?? event.date, event.end_time);
      matchesDate = end.getTime() < Date.now();
    }

    return matchesSearch && matchesCategory && matchesType && matchesDate;
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Page Header */}
      <section className="py-16 pt-32 bg-white">
        <div className="container mx-auto px-4">
          <div
            className={`text-center space-y-6 transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              {t("events.hero.title")}
            </h1>
            <p className="text-lg text-gray-900 max-w-2xl mx-auto">
               {t("events.hero.description")}
            </p>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 bg-white border-b border-yellow-500">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-900 w-4 h-4" />
              <Input
                placeholder= {t("events.searchField")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-300 border-yellow-500/30 focus:border-yellow-400 text-gray-900  placeholder-gray-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-900"> {t("events.filterBy")}</span>
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40 bg-gray-300 border-yellow-500/30 focus:border-yellow-400 text-gray-900">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-white border-yellow-500/30">
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} className="text-gray-900 hover:bg-yellow-500/10">
                    {category === "all" ? (lang === "am" ? "ሁሉም ምድቦች" : "All Categories") : category}
                  </SelectItem>

                  ))}
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40 bg-gray-300 border-yellow-500/30 focus:border-yellow-400 text-gray-900">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent className="bg-white border-yellow-500/30">
                 <SelectItem value="all" className="text-gray-900 hover:bg-yellow-500/10">
                  {t("events.upcomingFilters.all")}
                  </SelectItem>
                  <SelectItem value="upcoming" className="text-gray-900 hover:bg-yellow-500/10">
                    {t("events.upcomingFilters.upcoming")}
                  </SelectItem>
                  <SelectItem value="this-month" className="text-gray-900 hover:bg-yellow-500/10">
                    {t("events.upcomingFilters.thisMonth")}
                  </SelectItem>
                  <SelectItem value="past" className="text-gray-900 hover:bg-yellow-500/10">
                    {t("events.upcomingFilters.pastEvents")}
                  </SelectItem>
                </SelectContent>
              </Select>

              
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event, index) => (
              <Card
                key={event.id}
                className={`overflow-hidden bg-white border-yellow-500/20 hover:border-yellow-400/50 backdrop-blur-sm transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/10 group animate-fade-in-up ${
                  event.featured ? "ring-2 ring-yellow-500/30" : ""
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={`${api2}/${event.image}` || "/placeholder.svg"}
                    alt={event.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge
                      className={`${
                        event.category === "History"
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : event.category === "Education"
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            : event.category === "Art"
                              ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                              : event.category === "Youth"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                      }`}
                    >
                      {translateField(event, lang, "category")}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                <CardHeader>
                  <CardTitle className="text-gray-900 group-hover:text-yellow-400 transition-colors duration-300 min-h-[3rem] leading-6">
                    {translateField(event, lang, "title")}
                  </CardTitle>
                  <CardDescription className="font-serif text-gray-600 line-clamp-2 min-h-[3rem] leading-6">{translateField(event, lang, "description")}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 text-yellow-400 mr-2" />
                      {lang === 'am' ? formatEthiopian(new Date(event.dateRaw ?? event.date), { amharic: true }) : event.date}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 text-yellow-400 mr-2" />
                      {lang === 'am' ? `${formatEthiopianTime(`${event.start_time}`, { clock: 'ethiopian', amharic: true })}-${formatEthiopianTime(`${event.end_time}`, { clock: 'ethiopian', amharic: true })}` : `${convertTo12Hour(event.start_time)}-${convertTo12Hour(event.end_time)}`}
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

                  <div className="w-full bg-gray-300 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(event.registered / event.capacity) * 100}%` }}
                    ></div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold transform hover:scale-105 transition-all duration-300 group">
                        {t("events.eventCard.moreDetail")}
                        <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white border-yellow-500/30 text-white max-w-2xl max-h-[80vh] overflow-y-auto backdrop-blur-md">
                      <DialogHeader>
                        <DialogTitle className="text-2xl text-gray-900">
                          {translateField(event, lang, "title")}
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">{translateField(event, lang, "fullDescription")}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-6">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 text-yellow-400 mr-2" />
                            {lang === 'am' ? formatEthiopian(new Date(event.dateRaw ?? event.date), { amharic: true }) : event.date}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Clock className="w-4 h-4 text-yellow-400 mr-2" />
                            {lang === 'am' ? `${formatEthiopianTime(`${event.start_time}`, { clock: 'ethiopian', amharic: true })}-${formatEthiopianTime(`${event.end_time}`, { clock: 'ethiopian', amharic: true })}` : `${convertTo12Hour(event.start_time)}-${convertTo12Hour(event.end_time)}`}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 text-yellow-400 mr-2" />
                            {translateField(event, lang, "location")}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Users className="w-4 h-4 text-yellow-400 mr-2" />
                            {event.registered}/{event.capacity} { t("home.events.registered")}
                          </div>
                        </div>
                     { 
                        buildEndDate(event.dateRaw ?? event.date, event.end_time).getTime() >= Date.now() && event.registered < event.capacity && (
                          <div className="flex gap-4 pt-4">
                            <Button
                              className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold"
                              asChild
                            >
                              <Link to={`/events/${event.id}/tickets`}>{t("home.events.registerNow")}</Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-400 mb-2">{t("events.eventCard.noEvents")}</h3>
              <p className="text-gray-500">{t("events.eventCard.adjustFilter")}</p>
            </div>
          )}
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

