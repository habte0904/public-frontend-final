"use client"
import {api1,api2} from '../baseUrl.js'
import { useState, useEffect } from "react"
import Navigation from "../components/navigation"
import Footer from "../components/footer"
import { Button } from "../components/ui/button"
import { Advertisement } from "../components/advertisement"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog"
import { Clock, MapPin, Eye, X, ChevronLeft, ChevronRight, ZoomIn, Download, Share2, Heart, Users } from "lucide-react"
import { Link } from "react-router-dom"
import { getAllContent } from "../services/contentManagementService"
import axios from "axios"
import { useTranslation } from "react-i18next";
import { formatEthiopian, formatEthiopianTime } from "@/utils/ethiopianDate";
import { translateField } from "@/utils/translate";

// Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  const convertTo12Hour = (time24) => {
  const [hour, minute] = time24.split(":").map(Number)
  const period = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`
}

const defaultExibitionContent = {
   galleries: []
 }

export default function ExhibitionsPage() {
  const { i18n } = useTranslation();
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  // Exhibition Content State
  const [exhibitionContent, setExhibitionContent] = useState(defaultExibitionContent);
  const [gallery, setGallery] = useState();
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)


  // Fetch all content on mount
      const fetchContent = async () => {
      
      try {
        const res = await getAllContent()
        const data = res.data;
        
          // Map backend data to frontend state
          // You may need to adjust this mapping based on your backend response
  
         const exhibitionMedia = data.imageGalleries
        ?.filter(x => x.page_name === "exhibition" && x.section_name === "exhibition_media") || [];

        const galleries = exhibitionMedia.length > 0 ? [{
          id: exhibitionMedia[0].id, // keep first row's id
          title: exhibitionMedia[0].caption, // optional: you can set a general title or leave empty
          files: exhibitionMedia.map(g => ({
                  title: g.alt_text,
                  title_am: g.title_am,
                  description: g.caption,
                  description_am: g.description_am,
                  src: g.file_url
                }))

      }] : [];
       setExhibitionContent({ galleries });

        } catch (err) {
        console.error("Failed to fetch content:", err);
      }
    };
  useEffect(()=>{
    fetchContent();
  },[])


  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Fetch events from backend
  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${api1}/events/userSide`)
      const pastEvents = filterPastEvents(res.data);
      
      const eventsData = pastEvents.map(event => ({
        id: event.id,
        title: event.title,
        title_am: event.title_am,
        description: event.description,
        description_am: event.description_am,
        longDescription: event.fullDescription || event.description,
        longDescription_am: event.fullDescription_am || event.description_am,
        status: event.registered >= event.capacity ? "Completed" : "Past Event",
        status_am: event.registered >= event.capacity ? "የተጠናቀቀ" : "ያለፈ ሁነት",
        location: event.location,
        location_am: event.location_am,
        duration: event.start_time && event.end_time ? 
          `${event.start_time} - ${event.end_time}` : "Duration not specified",
        featured: event.featured || false,
        image: event.image || "/placeholder.svg",
        category: event.category || "Event",
        category_am: event.category_am || "Event",
        highlights: [
          `Total Capacity: ${event.capacity} attendees`,
          `Registered: ${event.registered} attendees`,
          "Memorable experience"
        ],
        highlights_am: [
          `ጠቅላላ አቅም፡ ${event.capacity} ታዳሚዎች፣`,
          `የተመዘገበ፡ ${event.registered} ታዳሚዎች፣`,
          "የማይረሳ ተሞክሮ"
        ],
        date: formatDate(event.dateRaw),
        dateRaw: event.dateRaw,
        start_time: event.start_time,
        end_time: event.end_time,
        capacity: event.capacity,
        registered: event.registered,
        type: event.type || "Free"
      }))
      setEvents(eventsData)
    } catch (e) {
      console.error("Failed to fetch events:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])
  // Filter events to only include past events (including today)
  const filterPastEvents = (events) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of day for accurate comparison
    
    return events.filter(event => {
      const eventDate = new Date(event.dateRaw);
      return eventDate <= today;
    });
  }


  const openGallery = (index) => {
    setSelectedImage(index)
    setCurrentImageIndex(index)
    document.body.style.overflow = "hidden"
  }

  const closeGallery = () => {
    setSelectedImage(null)
    document.body.style.overflow = "unset"
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % gallery?.files.length || 0)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + gallery?.files.length || 0) % gallery?.files.length || 0)
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedImage !== null) {
        if (e.key === "Escape") closeGallery()
        if (e.key === "ArrowRight") nextImage()
        if (e.key === "ArrowLeft") prevImage()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedImage])

useEffect(() => {
    if (exhibitionContent.galleries?.length > 0) {
      
      setGallery(exhibitionContent.galleries[0]);
    }
  }, [exhibitionContent.galleries]); // run only when galleries change

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Page Header */}
      <section className="py-20 pt-32 bg-white">
        <div className="container mx-auto px-4">
          <div
            className={`text-center space-y-6 transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
             {t('exhibitions.museum_exhibitions')}
            </h1>
            <p className="text-lg text-gray-900 max-w-2xl mx-auto">
              {t('exhibitions.museum_exhibitions_desc')}
            </p>
          </div>
        </div>
      </section>
      {/* Advertisement Banner */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Advertisement position="banner" />
        </div>
      </section>


      {/* Image Gallery Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bo text-gray-900 mb-4">
              {t('exhibitions.exhibition_gallery')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('exhibitions.exhibition_gallery_desc')}
            </p>
          </div>

          {/* Gallery grid */}

         { exhibitionContent.galleries.map((gallery, i) => (
          <div key={gallery.id} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.files.map((image, index) => (
              <div
                key={index}
                className="relative group cursor-pointer overflow-hidden rounded-lg aspect-square"
                onClick={() => openGallery(index)}
              >
                <img
                  src={image.src || "/placeholder.svg"}
                  alt={image.title}
                  className="object-cover transition-transform duration-500 group-hover:scale-110 w-full h-full"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <ZoomIn className="w-8 h-8 text-white" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <h3 className="text-white font-semibold text-sm"> {translateField(image, i18n.language, "title")}</h3>
                </div>
              </div>
            ))}
          </div>
        ))}
        </div>
      </section>

      {/* Full Screen Gallery Modal */}
      {selectedImage !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={closeGallery}
              className="absolute top-4 right-4 z-10 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors duration-300"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Buttons */}
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors duration-300"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors duration-300"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Main Image */}
            <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-8">
              {exhibitionContent.galleries.map((gallery, i) => (<img
                key={gallery.id}
                src={gallery.files[currentImageIndex].src || "/placeholder.svg"}
                alt={gallery.files[currentImageIndex].title}
                className="object-contain w-full h-full"
              />))}
            </div>

            {/* Image Info */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                { exhibitionContent.galleries.map((gallery, i) => (
                  <div key={gallery.id}>
                  <h3 className="text-xl font-semibold text-yellow-400 mb-1">
                     {translateField(gallery.files[currentImageIndex], i18n.language, "title")}
                  </h3>
                  <p className="text-gray-300"> {translateField(gallery.files[currentImageIndex], i18n.language, "description")}</p>
                </div>
                ))}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">
                    {currentImageIndex + 1} / {gallery?.files.length || 1}
                  </span>
                  <div className="flex space-x-2">
                    <button className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-300">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-300">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex space-x-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
              {exhibitionContent.galleries.map((gallery, i) => (
              gallery.files.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative w-12 h-12 rounded overflow-hidden transition-all duration-300 ${
                    index === currentImageIndex ? "ring-2 ring-yellow-400 scale-110" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={image.src || "/placeholder.svg"}
                    alt={image.title}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))))}
            </div>
          </div>
        </div>
      )}
    
 {/* Events Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
           <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bo text-gray-900 mb-4">
             {t('exhibitions.events_gallery')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('exhibitions.exhibition_gallery_desc')}
            </p>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">{t('exhibitions.loading_past_events')}</p>
            </div>
          ) : events.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event, index) => (
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
                      className="object-cover group-hover:scale-110 transition-transform duration-700 w-full h-full"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge
                        className={`${
                          event.category === "History"
                            ? "bg-red-500 text-white border-red-500/30"
                            : event.category === "Culture"
                              ? "bg-purple-500 text-white border-purple-500/30"
                              : event.category === "Military"
                                ? "bg-orange-500 text-white border-orange-500/30"
                                : "bg-blue-500 text-white border-blue-500/30"
                        }`}
                      >
                       {translateField(event, i18n.language, "category")}
                      </Badge>
                      {event.featured && (
                        <Badge className="bg-amber-500 text-white border-amber-500/30">{t('exhibitions.featured')}</Badge>
                      )}
                    </div>
                    <div className="absolute top-4 right-4">
                      <Badge
                        className={`${
                          event.status === "Completed"
                            ? "bg-gray-500 text-white border-gray-500/30"
                            : "bg-yellow-500 text-white border-yellow-500/30"
                        }`}
                      >
                         {translateField(event, i18n.language, "status")}
                      </Badge>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  <CardHeader>
                    <CardTitle className="text-gray-900 group-hover:text-yellow-400 transition-colors duration-300 min-h-[3rem] leading-6">
                       {translateField(event, i18n.language, "title")}
                    </CardTitle>
                    <CardDescription className="font-serif text-gray-600 line-clamp-2 min-h-[3rem] leading-6"> {translateField(event, i18n.language, "description")}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                                      <div className="flex items-center text-gray-600">
                                      <Clock className="w-4 h-4 text-yellow-400 mr-2" />
                                      {i18n.language === 'am' ? formatEthiopian(new Date(event.dateRaw), { amharic: true }) : event.date} • {i18n.language === 'am' ? formatEthiopianTime(`${event.start_time}`, { clock: 'ethiopian', amharic: true }) : convertTo12Hour(event.start_time)}-{i18n.language === 'am' ? formatEthiopianTime(`${event.end_time}`, { clock: 'ethiopian', amharic: true }) : convertTo12Hour(event.end_time)}
                                    </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 text-yellow-400 mr-2" />
                        {translateField(event, i18n.language, "location")}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="w-4 h-4 text-yellow-400 mr-2" />
                        {event.registered} {t('exhibitions.attendees')}
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold transform hover:scale-105 transition-all duration-300 group">
                          <Eye className="w-4 h-4 mr-2" />
                         {t('exhibitions.view_details')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white border-yellow-500/30 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-2xl bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent text-black">
                             {translateField(event, i18n.language, "title")}
                          </DialogTitle>
                          <DialogDescription className="text-gray-900"> {translateField(event, i18n.language, "longDescription")}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-6">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center text-gray-900">
                              <Clock className="w-4 h-4 mr-2 text-yellow-400" />
                               {i18n.language === 'am' ? formatEthiopian(new Date(event.dateRaw), { amharic: true }) : event.date} •  {i18n.language === 'am' ? formatEthiopianTime(`${event.start_time}`, { clock: 'ethiopian', amharic: true }) : convertTo12Hour(event.start_time)}-{i18n.language === 'am' ? formatEthiopianTime(`${event.end_time}`, { clock: 'ethiopian', amharic: true }) : convertTo12Hour(event.end_time)}
                            </div>
                            <div className="flex items-center text-gray-900">
                              <MapPin className="w-4 h-4 mr-2 text-yellow-400" />
                                 {translateField(event, i18n.language, "location")}
                            </div>
                            <div className="flex items-center text-gray-900">
                              <Users className="w-4 h-4 mr-2 text-yellow-400" />
                              {event.registered} {t('exhibitions.attendees_participated')}
                            </div>
                            <div className="flex items-center text-gray-900">
                              <Badge className={
                                event.status === "Completed" 
                                  ? "bg-gray-500 text-gray-900" 
                                  : "bg-yellow-500 text-gray-900"
                              }>
                                {translateField(event, i18n.language, "status")}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-gray-900 font-semibold mb-2">{t('exhibitions.event_summary')}</h4>
                            <ul className="space-y-1">
                              {event.highlights.map((highlight, highlightIndex) => (
                                <li key={highlightIndex} className="flex items-center text-gray-900 text-sm">
                                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3 flex-shrink-0 "></div>
                                    {i18n.language === 'am' && event.highlights_am
                                      ? event.highlights_am[highlightIndex]
                                      : highlight}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="flex gap-4 pt-4">
                            <Button
                              className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold"
                              asChild
                            >
                              <Link to={`/events`}>{t('exhibitions.view_upcoming_events')}</Link>
                            </Button>
                           
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">{t('exhibitions.no_past_events')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-white border-y border-yellow-400">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">{t('exhibitions.ready_to_explore')}</h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              {t('exhibitions.ready_to_explore_desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold px-8 py-3 transform hover:scale-105 transition-all duration-300"
                asChild
              >
                <Link to="/tickets">{t('exhibitions.buy_tickets')}</Link>
              </Button>
              <Button
                variant="outline"
                className="border-yellow-500/50 text-black hover:bg-yellow-500/10 bg-transparent px-8 py-3"
                asChild
              >
                <Link to="/events">{t('exhibitions.view_events')}</Link>
              </Button>
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

