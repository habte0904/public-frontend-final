"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import Navigation from "../components/navigation"
import Footer from "../components/footer"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Filter,
  QrCode,
  Eye,
  Ticket,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react"
import { useAuth } from "../contexts/auth-context"
import { formatEthiopian } from "@/utils/ethiopianDate"
import { useTranslation } from "react-i18next";
import { translateField } from "@/utils/translate";

import ticketService from "../services/ticket.service";
export default function MyTicketsPage() {
  const { i18n } = useTranslation();
  const { t } = useTranslation();
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [isVisible, setIsVisible] = useState(false)
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsVisible(true);
    async function fetchTickets() {
      setLoading(true);
      setError("");
      try {
        const data = await ticketService.getMyTickets();
        const allTickets = [
          ...(data.data.normalTickets || []).map(t => ({
            id: t.chapa_tx_ref,
            title: "Museum Visit",
            title_am: "የሙዚየም ጉብኝት",
            date: t.visit_date,
            time: "",
            status: t.status,
            location: "Museum",
            location_am: "የ አድዋ ድል መታሰብያ",
            tickets: { adult: t.total_tickets },
            total: t.paid_amount,
            services: [],
            qrCode: "",
            bookingDate: t.visit_date,
          })),
          ...(data.data.eventTickets || []).flatMap(event =>
            event.tickets.map(t => ({
              id: t.ticket_id,
              title: event.booking.event_name || "Event Ticket",
              title_am: event.booking.event_name_am,
              date: event.booking.event_date,
              time: t.time || "",
              status: t.status,
              location: event.booking.event_location || "Event Hall",
              location_am: event.booking.event_location_am || "Event Hall",
              tickets: { [t.type]: 1 },
              total: t.price,
              services: [],
              qrCode: t.qr_code || "",
              bookingDate: event.booking.bought_at,
            }))
          ),
        ];
        setTickets(allTickets);
      } catch (err) {
        setError("Failed to load tickets.");
      }
      setLoading(false);
    }
    fetchTickets();
  }, []);

  // ...rest of your code unchanged, except tickets now comes from API...

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200"
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "pending":
        return <RefreshCw className="w-4 h-4" />
      case "cancelled":
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    const matchesDate =
      dateFilter === "all" ||
      (dateFilter === "upcoming" && new Date(ticket.date) > new Date()) ||
      (dateFilter === "past" && new Date(ticket.date) < new Date())

    return matchesSearch && matchesStatus && matchesDate
  })

  const getTicketCounts = () => {
    return {
      all: tickets.length,
      confirmed: tickets.filter((t) => t.status === "confirmed").length,
      completed: tickets.filter((t) => t.status === "completed").length,
      pending: tickets.filter((t) => t.status === "pending").length,
      cancelled: tickets.filter((t) => t.status === "cancelled").length,
    }
  }

  const ticketCounts = getTicketCounts()

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navigation />

        <section className="py-20 pt-32 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Ticket className="w-8 h-8 text-amber-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('my_tickets.sign_in_required')}</h1>
              <p className="text-gray-600 mb-8">{t('my_tickets.sign_in_prompt')}</p>
              <div className="flex gap-4 justify-center">
                <Button
                  asChild
                  className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-semibold"
                >
                  <Link to="/signin">{t('my_tickets.sign_in')}</Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="border-amber-500/50 text-black hover:bg-amber-500/10 bg-transparent"
                >
                  <Link to="/signup">{t('my_tickets.create_account')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    )
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
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              {t('my_tickets.page_title')}
            </h1>
            <p className="text-lg text-gray-900 max-w-2xl mx-auto">
              {t('my_tickets.page_desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t('my_tickets.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tickets Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8 bg-gray-100">
              <TabsTrigger
                value="all"
                className="text-gray-900 data-[state=active]:bg-amber-400 data-[state=active]:text-black"
              >
                {t('my_tickets.all')} ({ticketCounts.all})
              </TabsTrigger>
              
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Ticket className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('my_tickets.no_tickets_found')}</h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                      ? t('my_tickets.try_adjusting')
                      : t('my_tickets.no_tickets_yet')}
                  </p>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-semibold"
                  >
                    <Link to="/tickets">{t('my_tickets.book_first')}</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTickets.map((ticket) => (
                    <Card
                      key={ticket.id}
                      className="bg-white border-amber-500/20 hover:border-amber-400/50 transition-all duration-300 group"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-gray-900 group-hover:text-amber-400 transition-colors duration-300">
                              {translateField(ticket, i18n.language, "title")}
                            </CardTitle>
                            <CardDescription className="text-gray-600">{t('my_tickets.booking_id')}: {ticket.id}</CardDescription>
                          </div>
                          <Badge className={getStatusColor(ticket.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(ticket.status)}
                              <span className="capitalize">{ticket.status}</span>
                            </div>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 text-amber-400 mr-2" />
                            {i18n.language === 'am' ? formatEthiopian(new Date(ticket.date), { amharic: true }) : new Date(ticket.date).toLocaleDateString()}
                          </div>
                          
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 text-amber-400 mr-2" />
                            {translateField(ticket, i18n.language, "location")}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Users className="w-4 h-4 text-amber-400 mr-2" />
                            {Object.values(ticket.tickets).reduce((sum, count) => sum + count, 0)} {t('my_tickets.tickets')}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div className="text-lg font-semibold text-amber-600">{ticket.total} {t('my_tickets.etb')}</div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10 bg-transparent"
                              asChild
                            >
                              <Link to={ticket.title === "Museum Visit" ? `/confirmation/${ticket.id}` : `/eventConfirmation/${ticket.id}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                {t('my_tickets.view')}
                              </Link>
                            </Button>
                            {ticket.status === "confirmed" && (
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-semibold"
                              >
                                <QrCode className="w-4 h-4 mr-1" />
                                {t('my_tickets.qr_code')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Other tab contents would be similar, filtered by status */}
            {["confirmed", "completed", "pending", "cancelled"].map((status) => (
              <TabsContent key={status} value={status} className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTickets
                    .filter((ticket) => ticket.status === status)
                    .map((ticket) => (
                      <Card
                        key={ticket.id}
                        className="bg-white border-amber-500/20 hover:border-amber-400/50 transition-all duration-300 group"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-gray-900 group-hover:text-amber-400 transition-colors duration-300">
                                {translateField(ticket, i18n.language, "title")}
                              </CardTitle>
                              <CardDescription className="text-gray-600">{t('my_tickets.booking_id')}: {ticket.id}</CardDescription>
                            </div>
                            <Badge className={getStatusColor(ticket.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(ticket.status)}
                                <span className="capitalize">{ticket.status}</span>
                              </div>
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center text-gray-600">
                              <Calendar className="w-4 h-4 text-amber-400 mr-2" />
                              {i18n.language === 'am' ? formatEthiopian(new Date(ticket.date), { amharic: true }) : new Date(ticket.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Clock className="w-4 h-4 text-amber-400 mr-2" />
                              {ticket.time}
                            </div>
                            <div className="flex items-center text-gray-600">
                              <MapPin className="w-4 h-4 text-amber-400 mr-2" />
                              {translateField(ticket, i18n.language, "location")}
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Users className="w-4 h-4 text-amber-400 mr-2" />
                              {Object.values(ticket.tickets).reduce((sum, count) => sum + count, 0)} {t('my_tickets.tickets')}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="text-lg font-semibold text-amber-600">{ticket.total} {t('my_tickets.etb')}</div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10 bg-transparent"
                                asChild
                              >
                                <Link to={ticket.title === "Museum Visit" ? `/confirmation/${ticket.id}` : `/eventConfirmation/${ticket.id}`}>
                                  <Eye className="w-4 h-4 mr-1" />
                                  {t('my_tickets.view')}
                                </Link>
                              </Button>
                              {ticket.status === "confirmed" && (
                                <Button
                                  size="sm"
                                  className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-semibold"
                                >
                                  <QrCode className="w-4 h-4 mr-1" />
                                  {t('my_tickets.qr_code')}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">{t('my_tickets.quick_actions')}</h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              {t('my_tickets.quick_actions_desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-semibold px-8 py-3 transform hover:scale-105 transition-all duration-300"
                asChild
              >
                <Link to="/tickets">{t('my_tickets.book_new')}</Link>
              </Button>
              <Button
                variant="outline"
                className="border-amber-500/50 text-black hover:bg-amber-500/10 bg-transparent px-8 py-3"
                asChild
              >
                <Link to="/events">{t('my_tickets.view_events')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

