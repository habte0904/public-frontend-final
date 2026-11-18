"use client"
import { getAllContent } from "../services/contentManagementService"
import { useState, useEffect } from "react"
import Navigation from "../components/navigation"
import Footer from "../components/footer"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Badge } from "../components/ui/badge"
import { MapPin, Phone, Mail, Clock, MessageSquare, Send, Facebook, Twitter, Instagram, Youtube, CheckCircle, Info, Car, Bus, Plane } from "lucide-react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useTranslation } from "react-i18next";
import { translateField } from "@/utils/translate";
import axios from "axios"
import { toast } from "react-toastify"
import { api1, api2 } from "../baseUrl"
const defaultMuseumInfo = {
  contact: {
    opening_hours: "",
    opening_hours_am:"",
    phone: "",
    email: ""
  }
 }

export default function ContactPage() {
  const { i18n } = useTranslation();
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  // Museum Information State
    const [museumInfo, setMuseumInfo] = useState(defaultMuseumInfo);

    // Fetch all content on mount
      const fetchContent = async () => {
      
      try {
        
        const res = await getAllContent()
        const data = res.data;
        
          setMuseumInfo({
          contact: {
            museum_name: data.museumInfo?.find(x => x.setting_key === "museum_name")?.setting_value || "",
            opening_hours: data.museumInfo?.find(x => x.setting_key === "opening_hours")?.setting_value || "",
            phone: data.museumInfo?.find(x => x.setting_key === "contact_phone")?.setting_value || "",
            email: data.museumInfo?.find(x => x.setting_key === "contact_email")?.setting_value || "",
            opening_hours_am: data.museumInfo?.find((x) => x.setting_key_am === "opening_hours_am")?.setting_value_am || "",
          }
        })

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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubjectChange = (value) => {
    setFormData((prev) => ({ ...prev, subject: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Mock form submission
    await new Promise((resolve) => setTimeout(resolve, 1000))

    try{
      await axios.post(`${api1}/contact`,formData);

    }catch(err){
     toast.error("error sending feedback")
    }

    setIsSubmitting(false)
    setIsSubmitted(true)
    setFormData({ name: "", email: "", subject: "", message: "" })

    // Reset success message after 5 seconds
    setTimeout(() => setIsSubmitted(false), 5000)
  }

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
              {t('contact.page_title')}
            </h1>
            <p className="text-lg text-gray-900 max-w-2xl mx-auto">
              {t('contact.page_desc')}
            </p>
          </div>
        </div>
      </section>
      {/* Contact Information */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-4 gap-8 mb-16">
              <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300 text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-6 h-6 text-amber-600" />
                  </div>
                  <CardTitle className="text-gray-900">{t('contact.visit_us')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600" style={{whiteSpace: 'pre-line'}}>
                    {t('contact.churchill_address')}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300 text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-6 h-6 text-amber-600" />
                  </div>
                  <CardTitle className="text-gray-900">{t('contact.call_us')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    {museumInfo.contact.phone}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300 text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-amber-600" />
                  </div>
                  <CardTitle className="text-gray-900">{t('contact.email_us')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    {museumInfo.contact.email}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300 text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <CardTitle className="text-gray-900">{t('contact.opening_hours')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    {translateField(museumInfo.contact, i18n.language, "opening_hours")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div
              className={`transition-all duration-1000 delay-300 ${isVisible ? "translate-x-0 opacity-100" : "-translate-x-20 opacity-0"}`}
            >
              <Card className="bg-white border-yellow-500/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <MessageSquare className="w-5 h-5 text-amber-600 mr-2" />
                    {t('contact_form.send_message')}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {t('contact_form.form_desc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isSubmitted ? (
                    <div className="text-center py-8 space-y-4">
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                        <Send className="w-8 h-8 text-green-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">{t('contact_form.sent_title')}</h3>
                      <p className="text-gray-900">{t('contact_form.sent_desc')}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-gray-700">
                            {t('contact_form.full_name')}
                          </Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="mt-1 border-gray-300 focus:border-amber-400"
                            placeholder={t('contact_form.full_name_placeholder')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-gray-700">
                            {t('contact_form.email')}
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="mt-1 border-gray-300 focus:border-amber-400"
                            placeholder={t('contact_form.email_placeholder')}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-gray-700">
                          {t('contact_form.subject')}
                        </Label>
                        <Select value={formData.subject} onValueChange={handleSubjectChange} required>
                          <SelectTrigger className="mt-1 border-gray-300 focus:border-amber-400">
                            <SelectValue placeholder={t('contact_form.subject_placeholder')} />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-yellow-500/30">
                            <SelectItem value="general" className="text-gray-900 hover:bg-yellow-500/10">
                              {t('contact_form.subject_general')}
                            </SelectItem>
                            <SelectItem value="tickets" className="text-gray-900 hover:bg-yellow-500/10">
                              {t('contact_form.subject_tickets')}
                            </SelectItem>
                            <SelectItem value="events" className="text-gray-900 hover:bg-yellow-500/10">
                              {t('contact_form.subject_events')}
                            </SelectItem>
                            <SelectItem value="group" className="text-gray-900 hover:bg-yellow-500/10">
                              {t('contact_form.subject_group')}
                            </SelectItem>
                            <SelectItem value="media" className="text-gray-900 hover:bg-yellow-500/10">
                              {t('contact_form.subject_media')}
                            </SelectItem>
                            <SelectItem value="feedback" className="text-gray-900 hover:bg-yellow-500/10">
                              {t('contact_form.subject_feedback')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-gray-700">
                          {t('contact_form.message')}
                        </Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          rows={6}
                          className="mt-1 border-gray-300 focus:border-amber-400"
                          placeholder={t('contact_form.message_placeholder')}
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                            {t('contact_form.sending')}
                          </div>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            {t('contact_form.send')}
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
            {/* Interactive Map with Leaflet */}
            <Card className="bg-white border-yellow-500/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">{t('contact.location')}</CardTitle>
                <CardDescription className="text-gray-600">{t('contact.location_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-64 rounded-lg overflow-hidden border border-yellow-500/20">
                  <MapContainer
                    center={[9.036, 38.751]} // Adwa Museum, Churchill Ave, Addis Ababa
                    zoom={16}
                    scrollWheelZoom={false}
                    style={{ width: "100%", height: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[9.036, 38.751]} icon={L.icon({ iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", iconSize: [25, 41], iconAnchor: [12, 41] })}>
                      <Popup>
                        {t('contact.location_popup').split('\n').map((line, idx) => <span key={idx}>{line}<br/></span>)}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">{t('contact.location_note')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('contact.location_map_hint')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
