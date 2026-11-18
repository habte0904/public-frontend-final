"use client"
import { getAllContent } from "../services/contentManagementService"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Navigation from "../components/navigation"
import Footer from "../components/footer"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import {
  Eye,
  Target,
  MapPin,
  Phone,
  ArrowRight,
} from "lucide-react"
import { Advertisement } from "../components/advertisement"
import { useTranslation } from "react-i18next";
import { translateField } from "@/utils/translate";
import {format} from "date-fns"

const defaultHomeContent = {
  hero: {
    backgroundImage: "",
    title: "",
    motto: "",
    title_am:"",
    motto_am:"",
  }
}
const defaultAboutContent = {
  hero: {
    backgroundImage: "",
    title: "",
    title_am: ""
  },
  content: {
    title: "",
    title_am: "",
    description: "",
    description_am: "",
    carouselImages: ["", "", "", "", ""],
  },
  mission: {
    id: -1,
    title: "",
    title_am:"",
    description: "",
    description_am: ""
  },
  vision: {
    id: -1,
    title: "",
    title_am:"",
    description: "",
    description_am: ""
  },
  values: [],
  journey: [],
}

const defaultMuseumInfo = {
  contact: {
    opening_hours: "",
    opening_hours_am:"",
    phone: "",
    email: "",
  },
  museum_exp: {
    historical_artifacts: { value: "", description: "" ,description_am:""},
    interactive_exhibits: { value: "", description: "",description_am :""},
    annual_visitors: { value: "", description: "" ,description_am:""},
    expert_guides: { value: "", description: "" ,description_am:""},
  },
}

 

export default function AboutPage() {
   const { i18n } = useTranslation();
   const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false)
  const [selectedTeamMember, setSelectedTeamMember] = useState(0)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  // About Page Content State
  const [aboutContent, setAboutContent] = useState(defaultAboutContent);
  const [homeContent, setHomeContent] = useState(defaultHomeContent);
  // Museum Information State
  const [museumInfo, setMuseumInfo] = useState(defaultMuseumInfo);

  // Fetch all content on mount
    const fetchContent = async () => {
      try {
        const res = await getAllContent()
        const data = res.data
        const getMuseumExp = (key) => {
          const item = data.museumInfo?.find((x) => x.setting_key === key)
          return item ? { value: item.setting_value, description: item.description,description_am:item.description_am  } : null
        }
        // Map backend data to frontend stateMap backend data to frontend state
          // You may need to adjust this mapping based on your backend response
            setHomeContent({
              hero: {
                backgroundImage: data.pageContent?.find(
                  (x) => x.page_name === "home" && x.section_name === "hero" && x.background_image,
                )?.background_image,
                title: data.pageContent?.find((x) => x.page_name === "home" && x.section_name === "hero")?.title || "",
                motto: data.pageContent?.find((x) => x.page_name === "home" && x.section_name === "hero")?.subtitle || "",
                title_am: data.pageContent?.find((x) => x.page_name === "home" && x.section_name === "hero")?.title_am || "",
                motto_am: data.pageContent?.find((x) => x.page_name === "home" && x.section_name === "hero")?.subtitle_am || "",
              }
            })


          setAboutContent({
              hero: {
                backgroundImage:
                  data.pageContent?.find((x) => x.page_name === "about" && x.section_name === "hero")?.background_image || "",
                title: data.pageContent?.find((x) => x.page_name === "about" && x.section_name === "hero")?.title || "",
                title_am: data.pageContent?.find((x) => x.page_name === "about" && x.section_name === "hero")?.title_am || ""
              },
              content: {
                title:
                  data.pageContent?.find((x) => x.page_name === "about" && x.section_name === "content_section")?.title || "",
                title_am:
                  data.pageContent?.find((x) => x.page_name === "about" && x.section_name === "content_section")?.title_am || "",
                description:
                  data.pageContent?.find((x) => x.page_name === "about" && x.section_name === "content_section")?.content ||
                  "",
                description_am:
                  data.pageContent?.find((x) => x.page_name === "about" && x.section_name === "content_section")?.content_am ||
                  "",
               carouselImages: data.imageGalleries
              ?.filter(x => x.page_name === "about" && x.section_name === "carousel_images")
              .map(x => ( x.file_url )) || [],
              },
              mission: {
                id: data.missionVisionValues?.find((x) => x.type === "mission")?.id || "",
                title: data.missionVisionValues?.find((x) => x.type === "mission")?.title || "",
                title_am: data.missionVisionValues?.find((x) => x.type === "mission")?.title_am || "",
                description: data.missionVisionValues?.find((x) => x.type === "mission")?.description || "",
                description_am: data.missionVisionValues?.find((x) => x.type === "mission")?.description_am || "",
              },
              vision: {
                id: data.missionVisionValues?.find((x) => x.type === "vision")?.id || "",
                title: data.missionVisionValues?.find((x) => x.type === "vision")?.title || "",
                title_am: data.missionVisionValues?.find((x) => x.type === "vision")?.title_am || "",
                description: data.missionVisionValues?.find((x) => x.type === "vision")?.description || "",
                description_am: data.missionVisionValues?.find((x) => x.type === "vision")?.description_am || "",
              },
              values:
                data.missionVisionValues
                  ?.filter((x) => x.type === "value")
                  ?.map((x) => ({ id: x.id, title: x.title, title_am: x.title_am, description: x.description, description_am: x.description_am })) || [],
              journey:
                data.journeyTimeline?.map((x) => ({
                  id: x.id,
                  year: x.date,
                  title: x.title,
                  title_am: x.title_am,
                  description: x.description,
                  description_am: x.description_am,
                  image: x.image_url,
                })) || [],
            })


          setMuseumInfo({
            contact: {
          museum_name: data.museumInfo?.find((x) => x.setting_key === "museum_name")?.setting_value || "",
          opening_hours: data.museumInfo?.find((x) => x.setting_key === "opening_hours")?.setting_value || "",
          museum_name_am: data.museumInfo?.find((x) => x.setting_key_am === "museum_name_am")?.setting_value_am || "",
          opening_hours_am: data.museumInfo?.find((x) => x.setting_key_am === "opening_hours_am")?.setting_value_am || "",
          phone: data.museumInfo?.find((x) => x.setting_key === "contact_phone")?.setting_value || "",
          email: data.museumInfo?.find((x) => x.setting_key === "contact_email")?.setting_value || "",
        },
            museum_exp: {
              historical_artifacts: getMuseumExp("historical_artifacts"),
              interactive_exhibits: getMuseumExp("interactive_exhibits"),
              annual_visitors: getMuseumExp("annual_visitors"),
              expert_guides: getMuseumExp("expert_guides"),
            },
          })
        } catch (err) {
        console.error("Failed to fetch content:", err);
      }
    };
  useEffect(()=>{
    fetchContent();
  },[])

  const carouselImages = [...aboutContent.content.carouselImages];
 

 useEffect(() => {
  setIsVisible(true);

  // Reset index if images change
  setCurrentImageIndex(0);

  // Auto-play carousel
  const interval = setInterval(() => {
    setCurrentImageIndex((prev) =>
      carouselImages.length > 0 ? (prev + 1) % carouselImages.length : 0
    );
  }, 4000);

  return () => clearInterval(interval);
}, [carouselImages.length]);


  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Hero Section with Video Background Concept */}
      <section className="relative py-20 bg-gradient-to-br from-gray-400 via-gray-600 to-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={aboutContent.hero.backgroundImage}
            alt="Adwa Museum interior showcasing Ethiopian heritage"
            className="object-cover opacity-50 w-full h-full"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/80"></div>
        </div>

        <div className="relative z-10 container mx-auto px-6 pt-20">
          <div
            className={`text-center transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}
          >
            <h1 className="font-eb-garamond text-5xl lg:text-7xl font-light mb-6 text-white">
              {t('about.about')} <span className="text-amber-400">{translateField(homeContent.hero, i18n.language, "title")}</span>
            </h1>
            <div className="w-32 h-px bg-amber-400 mx-auto mb-8"></div>
            <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-8">
                {translateField(aboutContent.hero, i18n.language, "title")}
            </p>

            
          </div>
        </div>
      </section>

      {/* Museum Overview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 mt-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div
              className={`transition-all duration-1000 ${isVisible ? "translate-x-0 opacity-100" : "-translate-x-20 opacity-0"}`}
            >
              <div className="relative mb-12">
                <h2 className="font-eb-garamond text-4xl lg:text-5xl text-gray-900 mb-2"> {translateField(aboutContent.content, i18n.language, "title")}</h2>
                <div className="w-24 h-px bg-amber-400"></div>
              </div>

              <div className="space-y-6 text-gray-700 leading-relaxed text-base mb-12">
                {translateField(aboutContent.content, i18n.language, "description")
                  .split('\r\n\r\n')
                  .map((para, i) => (
                    <p key={i}>{para}</p>
                ))}
              </div>
            </div>

            <div
              className={`transition-all duration-1000 delay-300 ${isVisible ? "translate-x-0 opacity-100" : "translate-x-20 opacity-0"}`}
            >
              <div className="relative h-96 rounded-lg overflow-hidden shadow-2xl">
                <div
                  className="flex transition-transform duration-1000 ease-in-out h-full"
                  style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                >
                  {carouselImages.map((image, index) => (
                    <div key={index} className="w-full h-full flex-shrink-0 relative">
                      
                      <img
                        src={image || "/placeholder.svg"}
                        alt=""
                        className="object-cover w-full h-full"
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                      </div>
                    </div>
                  ))}
                </div>

                {/* Carousel indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {carouselImages.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentImageIndex ? "bg-amber-400" : "bg-white/50"
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision & Values */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-eb-garamond text-4xl lg:text-5xl text-gray-900 mb-4">{t('about.mission_vision_values')}</h2>
            <div className="w-24 h-px bg-amber-400 mx-auto"></div>
          </div>

          {/* Mission & Vision */}
          <div className="grid lg:grid-cols-2 gap-12 mb-20">
            <Card className="bg-white border-amber-200  hover:border-amber-400/50 backdrop-blur-sm transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/10">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                  <Target className="w-8 h-8 text-amber-400" />
                </div>
                <CardTitle className="text-2xl text-gray-900">{translateField(aboutContent.mission, i18n.language, "title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed text-center">
                 {translateField(aboutContent.mission, i18n.language, "description")}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-amber-200  hover:border-amber-400/50 backdrop-blur-sm transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/10">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                  <Eye className="w-8 h-8 text-amber-400" />
                </div>
                <CardTitle className="text-2xl text-gray-900">{translateField(aboutContent.vision, i18n.language, "title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed text-center">
                   {translateField(aboutContent.vision, i18n.language, "description")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Core Values */}
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 text-center mb-12">{t('about.core_values')}</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {aboutContent.values.map((value, index) => (
                <Card
                  key={index}
                  className="bg-white border-amber-200  hover:border-amber-400/50 backdrop-blur-sm transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/10 text-center"
                >
                  <CardContent className="p-6">
                    
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">{translateField(value, i18n.language, "title")}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{translateField(value, i18n.language, "description")}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Museum Timeline */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-eb-garamond text-4xl lg:text-5xl text-gray-900 mb-4">{t('about.our_journey')}</h2>
            <div className="w-24 h-px bg-amber-400 mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {t('about.our_journey_desc')}
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-px h-full bg-gradient-to-b from-amber-400/50 via-amber-400/30 to-transparent hidden lg:block"></div>

            <div className="space-y-16">
              {aboutContent.journey.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} flex-col lg:space-x-12`}
                >
                  <div
                    className={`lg:w-5/12 ${index % 2 === 0 ? "lg:text-right" : "lg:text-left"} text-center mb-8 lg:mb-0`}
                  >
                    <Card className="bg-white border-amber-500/20 backdrop-blur-sm hover:border-amber-400/50 transition-all duration-300">
                      <CardContent className="p-8">
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4 text-lg px-4 py-2">
                          {format(new Date(item.year),"yyyy")}
                        </Badge>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">{translateField(item, i18n.language, "title")}</h3>
                        <p className="text-gray-600 leading-relaxed">{translateField(item, i18n.language, "description")}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="w-6 h-6 bg-amber-400 rounded-full border-4 border-white z-10 hidden lg:block shadow-lg"></div>

                  <div className="lg:w-5/12">
                    <div className="relative overflow-hidden rounded-lg shadow-2xl">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={`${item.title} - ${item.year}`}
                        width={500}
                        height={300}
                        className="w-full h-64 object-cover hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Museum Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">{t('about.museum_experience')}</h2>
              <p className="text-xl text-gray-600">
               {t('about.museum_experience_desc')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
               {museumInfo.museum_exp && (Object.entries(museumInfo.museum_exp).map(([key, exp]) => (
                <div key={key} className="text-center">
                  <div className="text-4xl font-bold text-amber-600 mb-2">{exp.value}</div>
                  <div className="text-lg capitalize font-semibold text-gray-900 mb-2">  {t(`about.exp.${key}`)} </div>
                  <div className="text-sm text-gray-600">{translateField(exp, i18n.language, "description")}</div>
                </div>
             )))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">{t('about.visit_us')}</h2>
              <p className="text-xl text-gray-600">{t('about.visit_us_desc')}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <MapPin className="w-5 h-5 text-amber-600 mr-2" />
                     {t('about.location_hours')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-gray-900">{t('about.address_label')}</p>
                    <p className="text-gray-600">
                      {t('about.address')}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{t('about.opening_hours')}</p>
                    <p className="text-gray-600">
                      
                      {translateField(museumInfo.contact, i18n.language, "opening_hours")}
                      
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <Phone className="w-5 h-5 text-amber-600 mr-2" />
                   {t('about.contact_info')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-gray-900"> {t('about.phone')}</p>
                    <p className="text-gray-600"> {museumInfo.contact.phone}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{t('about.email')}</p>
                    <p className="text-gray-600">{museumInfo.contact.email}</p>
                  </div>
                
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-12">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white px-8 py-4 text-lg"
                asChild
              >
                <Link to="/tickets">
                  {t('about.book_your_visit')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
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
