"use client"
import { api1 } from '../baseUrl.js'
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns"
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTranslation } from 'react-i18next';

import { translateField } from "@/utils/translate";
import { formatEthiopian, formatEthiopianTime } from "@/utils/ethiopianDate";

import {
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Check,
  Info,
  Plus,
  Minus,
  Download,
  Phone,
  Mail,
  Printer,
  Ticket,
  User,
  ArrowLeft,
  Loader2,
  Smartphone,
  Building2,
  Wallet,
} from "lucide-react";


const convertTo12Hour = (time24) => {
  const [hour, minute] = time24.split(":").map(Number)
  const period = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`
}
export default function EventTicketsPage() {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const params = useParams()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isVisible, setIsVisible] = useState(false)
  const [showTicket, setShowTicket] = useState(false)
  const [errors, setErrors] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})

  // const { isAuthenticated, user } = useAuth();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [ticketData, setTicketData] = useState({
    ticketSelections: {},
    customerInfo: {
      name: "",
      email: "",
      phone: "",
      specialRequests: "",
    },
    paymentMethod: "",
  })

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const [confirmedBookingId, setConfirmedBookingId] = useState(null)
  const [confirmedTicketId, setConfirmedTicketId] = useState(null)

  // Scroll to progress steps section when step changes
  useEffect(() => {
    const progressSection = document.getElementById("progress-steps")
    if (progressSection) {
      progressSection.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [currentStep])

  // Mock event data - in real app, this would come from API based on params.id
  const [event, setEvent] = useState({
    id: params.id,
    title: "Battle of Adwa Anniversary Celebration",
    date: "March 2, 2024",
    dateRaw: "2024-03-02",
    time: "10:00 AM - 4:00 PM",
    start_time: "10:00",
    end_time: "16:00",
    location: "Main Hall",
  });

  const steps = [
    { number: 1, title: t("eventTickets.buySteps.selectTickets"), icon: Ticket },
    { number: 2, title: t("eventTickets.buySteps.info_pay"), icon: User },
  ]

  const handleFieldErrors = (errorsArray) => {
    const newErrors = {
      full_name: "",
      email: "",
      phone_no: "",
    };

    errorsArray.forEach((err) => {
      if (err.path in newErrors) {
        newErrors[err.path] = err.msg;
      }
    });
    setFieldErrors((prev) => ({ ...prev, ...newErrors }));
  };

  const buildEvent = (data) => {
    if (!data) return null;
    return {
      id: data.id,
      title: data.title,
      title_am: data.title_am,

      date: format(new Date(data.date), "yyyy-MM-dd"),
      dateRaw: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      time: `${convertTo12Hour(data.start_time)}-${convertTo12Hour(data.end_time)}`,
      location: data.location,
      location_am: data.location_am,
      is_free: data.is_free
    };
  }

  const [ticketTypes, setTicketTypes] = useState([]);
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`${api1}/events/userSide/${params.id}`);
        console.log("event", res);
        if (res.data) {
          setEvent(buildEvent(res.data[0]));
        } else {
          console.error("Failed to load event");
        }
      } catch (err) {
        console.error("Error fetching event:", err);
      }
    };
    fetchEvent();
  }, [params.id]);


  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await axios.get(`${api1}/events/${params.id}/ticketType`);
        if (res.data.success) {
          setTicketTypes(res.data.ticketTypes);
        } else {
          console.error("Failed to load ticket types");
        }
      } catch (err) {
        console.error("Error fetching tickets:", err);
      }
    };

    fetchTickets();
  }, [params.id]); useEffect(() => {
    // Auto-select free ticket and move to step 2 if event is free
    if (event?.is_free && ticketTypes.length > 0 && currentStep === 1) {
      const freeTicket = ticketTypes.find(t => Number(t.price) === 0);
      if (freeTicket) {
        setTicketData(prev => ({
          ...prev,
          ticketSelections: {
            ...prev.ticketSelections,
            [freeTicket.id]: 1
          }
        }));
        setCurrentStep(2);
      }
    }
  }, [event, ticketTypes]);



  const calculateTotal = () => {
    let total = 0;

    Object.entries(ticketData.ticketSelections).forEach(([ticketId, quantity]) => {
      const ticket = ticketTypes.find((t) => t.id === Number(ticketId)); // convert to number
      if (ticket && quantity > 0) {
        total += ticket.price * quantity;
      }
    });

    return total;
  };


  const getTotalTickets = () => {
    return Object.values(ticketData.ticketSelections).reduce((sum, quantity) => sum + quantity, 0)
  }

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const updateTicketQuantity = (ticketId, change) => {
    setTicketData((prev) => {
      const currentQuantity = prev.ticketSelections[ticketId] || 0
      const newQuantity = Math.max(0, Math.min(10, currentQuantity + change))

      return {
        ...prev,
        ticketSelections: {
          ...prev.ticketSelections,
          [ticketId]: newQuantity,
        },
      }
    })
  }

  const handleCompleteBooking = async () => {
    setIsProcessingPayment(true);
    setErrors(null);

    try {
      const selectedTickets = Object.entries(ticketData.ticketSelections || {})
        .filter(([ticketId, quantity]) => quantity > 0)
        .map(([ticketId, quantity]) => ({
          ticket_id: parseInt(ticketId, 10),
          quantity,
        }));

      if (selectedTickets.length === 0) {
        setErrors("Please select at least one ticket.");
        setIsProcessingPayment(false);
        return;
      }

      // Free Event Logic
      if (event.is_free) {
        const totalQty = selectedTickets.reduce((acc, curr) => acc + curr.quantity, 0);
        if (totalQty > 1) {
          setErrors("You can only get one ticket for a free event.");
          setIsProcessingPayment(false);
          return;
        }

        const payload = {
          event_id: parseInt(event.id, 10),
          full_name: ticketData.customerInfo.name,
          email: ticketData.customerInfo.email,
          phone_no: ticketData.customerInfo.phone,
          ticketTypes: selectedTickets,
        };

        const res = await fetch(`${api1}/create-free-ticket`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.errors) {
            handleFieldErrors(data.errors);
          } else {
            setErrors(data.message || "Failed to create ticket");
          }
          // Stop execution if error
          return
        }

        if (data.success) {
          setConfirmedBookingId(data.booking_id);
          setConfirmedTicketId(data.ticket_id);
          setShowTicket(true);
        } else {
          setErrors(data.message || "Something went wrong");
        }
        return;
      }

      // Paid Event Logic
      const payload = {
        event_id: parseInt(event.id, 10),
        full_name: ticketData.customerInfo.name,
        email: ticketData.customerInfo.email,
        phone_no: ticketData.customerInfo.phone,
        ticketTypes: selectedTickets,
      };

      const res = await fetch(`${api1}/event/initiate/telebirr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {

          handleFieldErrors(data.errors); // Express-validator errors
        } else {
          console.error("API error:", data);
        }
        return; // Stop further execution
      }

      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (data.success) {
        setConfirmedBookingId(data.tx_ref);
        setShowTicket(true);
      } else {
        throw new Error(data.message || "Payment failed");
      }

    } catch (err) {

      console.error("Payment initiation failed:", err);
      setErrors(err.message || "Something went wrong");
    } finally {
      setIsProcessingPayment(false);
    }
  };


  // Show ticket after successful payment
  if (showTicket) {
    const bookingId = confirmedTicketId || confirmedBookingId || "UNKOWN";
    const bookingLabel = confirmedTicketId ? "Ticket ID:" : "Booking ID:";

    const selectedTickets = Object.entries(ticketData.ticketSelections).filter(([_, quantity]) => quantity > 0)

    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <section className="py-8 sm:py-16 pt-8 sm:pt-32">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mx-auto">
              <Card className="shadow-lg">
                <CardHeader className="text-center bg-green-50 border-b">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl text-green-700">{t("eventConfirmation.confirmTitle")}</CardTitle>
                  <p className="text-green-600 text-sm sm:text-base">

                    {t("eventConfirmation.confirmDescription")}
                  </p>
                </CardHeader>

                <CardContent className="p-4 sm:p-8">
                  <div className="text-center mb-6 sm:mb-8">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 overflow-hidden">
                      <img
                        src="/images/qr-code.png"
                        alt="QR Code for event ticket verification"
                        width={128}
                        height={128}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Present this QR code at the event entrance</p>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-amber-50 p-4 sm:p-6 rounded-lg">
                      <h3 className="font-semibold text-amber-800 mb-3 sm:mb-4 text-base sm:text-lg">
                        {t("eventConfirmation.bookingDetail.title")}
                      </h3>
                      <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                        <div className="flex justify-between">
                          <span className="text-gray-600">{bookingLabel}</span>
                          <span className="font-medium">{bookingId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Event:{t("event")}</span>
                          <span className="font-medium">{event.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date:</span>
                          <span className="font-medium">{lang === 'am' ? formatEthiopian(new Date(event.dateRaw ?? event.date), { amharic: true }) : event.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Time:</span>
                          <span className="font-medium">{lang === 'am' ? `${formatEthiopianTime(`${event.start_time}`, { clock: 'ethiopian', amharic: true })}-${formatEthiopianTime(`${event.end_time}`, { clock: 'ethiopian', amharic: true })}` : event.time}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium">{event.location}</span>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <span className="text-gray-600 font-medium">Tickets:</span>
                          {selectedTickets.map(([ticketId, quantity]) => {
                            const ticket = ticketTypes.find((t) => t.id === ticketId)
                            return (
                              <div key={ticketId} className="flex justify-between ml-4">
                                <span className="text-gray-600">
                                  {ticket?.name} x {quantity}:
                                </span>
                                <span className="font-medium">
                                  {((ticket?.price || 0) * quantity).toLocaleString()} ETB
                                </span>
                              </div>
                            )
                          })}
                        </div>

                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Total Paid:</span>
                          <span className="text-amber-600">{calculateTotal().toLocaleString()} ETB</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 sm:p-6 rounded-lg">
                      <h3 className="font-semibold text-blue-800 mb-3 sm:mb-4 text-base sm:text-lg">
                        Important Information
                      </h3>
                      <ul className="space-y-2 text-xs sm:text-sm text-blue-700">
                        <li className="flex items-start">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                          Please arrive 30 minutes before the event starts
                        </li>
                        <li className="flex items-start">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                          Bring a valid ID for verification
                        </li>
                        <li className="flex items-start">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                          Show this ticket (digital or printed) at the entrance
                        </li>
                        <li className="flex items-start">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                          Contact us if you need to make changes
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-base sm:text-lg">
                        Contact Information
                      </h3>
                      <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-amber-500 flex-shrink-0" />
                          <span>Churchill Avenue, Addis Ababa, Ethiopia</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-amber-500 flex-shrink-0" />
                          <span>+251 11 123 4567</span>
                        </div>
                        <div className="flex items-center">
                          <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-amber-500 flex-shrink-0" />
                          <span>events@adwamuseum.et</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-sm sm:text-base" onClick={() => window.open(`${api1}/event/tickets/${confirmedBookingId}/pdf`, '_blank')}>
                        <Download className="w-4 h-4 mr-2" />
                        Download Ticket
                      </Button>
                      {!event.is_free && (
                        <Button variant="outline" className="flex-1 bg-transparent text-sm sm:text-base">
                          <Printer className="w-4 h-4 mr-2" />
                          Print
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-6 sm:mt-8 text-center">
                <Button
                  variant="ghost"
                  className="text-gray-600 hover:text-gray-900 text-sm sm:text-base"
                  onClick={() => navigate("/events")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Events
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
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <section className="bg-white text-white py-8 sm:py-16 pt-20 sm:pt-32">
        <div className="container mx-auto px-4 sm:px-6">
          <div
            className={`text-center transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}
          >
            <h1 className="font-eb-garamond text-3xl sm:text-4xl lg:text-5xl text-amber-500 mb-4">
              {t("eventTickets.hero.title")}
            </h1>
            <div className="w-16 sm:w-24 h-px bg-amber-400 mx-auto mb-4 sm:mb-6"></div>
            <p className="text-gray-900 text-base sm:text-lg max-w-2xl mx-auto">{
              lang === "am"
                ? `${t("eventTickets.hero.for")} ${translateField(event, lang, "title")} ${t("eventTickets.hero.description")}`
                : `${t("eventTickets.hero.description")} ${translateField(event, lang, "title")}`
            }


            </p>
          </div>
        </div>
      </section>

      {/* Progress Steps */}
      <section id="progress-steps" className="bg-white py-6 sm:py-8 border-b">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center min-w-0">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${currentStep >= step.number
                      ? "bg-amber-500 border-amber-500 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                      }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="w-4 h-4 sm:w-6 sm:h-6" />
                    ) : (
                      <step.icon className="w-4 h-4 sm:w-6 sm:h-6" />
                    )}
                  </div>
                  <span
                    className={`text-xs sm:text-sm mt-2 text-center ${currentStep >= step.number ? "text-amber-600 font-semibold" : "text-gray-500"
                      }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 sm:w-16 h-px mx-2 sm:mx-4 transition-all duration-300 ${currentStep > step.number ? "bg-amber-500" : "bg-gray-300"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-6 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Main Form */}
              <div className="lg:col-span-2">
                <Card className="shadow-sm border border-gray-200">
                  <CardContent className="p-4 sm:p-6">
                    {/* Step 1: Select Tickets */}
                    {currentStep === 1 && (
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{t("eventTickets.ticketCard.availableTickets")}</h2>
                          <p className="text-gray-600 text-sm sm:text-base">{t("eventTickets.ticketCard.ticketDescription")}</p>
                        </div>

                        <div className="space-y-4">
                          {ticketTypes.map((ticket) => (
                            <div
                              key={ticket.id}
                              className="border border-gray-200 rounded-lg p-4 hover:border-amber-200 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <h3 className="text-base font-semibold text-gray-900">{translateField(ticket, lang, "name")}</h3>
                                    <Badge className="bg-amber-100 text-amber-800 text-sm px-2 py-1">
                                      {ticket.price.toLocaleString()} {ticket.currency == "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")}
                                    </Badge>
                                  </div>
                                  <p className="text-gray-600 text-sm mb-3">{translateField(ticket, lang, "description")}</p>
                                  <div className="flex flex-wrap gap-2">
                                    {(lang === "am" ? ticket.features_am : ticket.features).map((feature, index) => (
                                      <span
                                        key={index}
                                        className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded"
                                      >
                                        {translateField({ feature, feature_am: feature }, lang, "feature")}
                                      </span>
                                    ))}
                                  </div>

                                </div>

                                {/* Quantity controls */}
                                <div className="ml-4 flex items-center space-x-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateTicketQuantity(ticket.id, -1)}
                                    disabled={(ticketData.ticketSelections[ticket.id] || 0) <= 0}
                                    className="w-8 h-8 p-0 border-gray-300"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <div className="flex items-center justify-center min-w-[2rem]">
                                    <span className="text-lg font-semibold text-gray-900">
                                      {ticketData.ticketSelections[ticket.id] || 0}
                                    </span>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateTicketQuantity(ticket.id, 1)}
                                    disabled={(ticketData.ticketSelections[ticket.id] || 0) >= (ticket.ticket_limit)}
                                    className="w-8 h-8 p-0 border-amber-500 text-amber-600 hover:bg-amber-50"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {getTotalTickets() > 0 && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-xs text-blue-800">
                              <Info className="w-3 h-3 inline mr-1" />
                              {t("eventTickets.ticketCard.totalSelected1")} {getTotalTickets()} {t("eventTickets.ticketCard.totalSelected2")} • {t("eventTickets.ticketCard.maxAllowed")}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 2: Customer Information & Payment */}
                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                            {t("eventTickets.userInfo.title")}
                          </h2>
                          <p className="text-gray-600 text-sm sm:text-base">
                            {t("eventTickets.userInfo.description")}
                          </p>
                        </div>

                        {/* Customer Information */}
                        <div className="space-y-4">
                          <h3 className="text-base font-semibold text-gray-900">{t("eventTickets.userInfo.contactDetails")}</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="name" className="text-sm">
                                {t("eventTickets.userInfo.fullName")}
                              </Label>
                              <Input
                                id="name"
                                placeholder={t("eventTickets.userInfo.fullNameField")}
                                value={ticketData.customerInfo.name}
                                onChange={(e) =>
                                  setTicketData((prev) => ({
                                    ...prev,
                                    customerInfo: { ...prev.customerInfo, name: e.target.value },
                                  }))
                                }
                                className="mt-1 text-sm"
                                required
                              />
                              {fieldErrors.full_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.full_name}</p>}
                            </div>
                            <div>
                              <Label htmlFor="email" className="text-sm">
                                {t("eventTickets.userInfo.email")}
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                placeholder={t("eventTickets.userInfo.emailField")}
                                value={ticketData.customerInfo.email}
                                onChange={(e) =>
                                  setTicketData((prev) => ({
                                    ...prev,
                                    customerInfo: { ...prev.customerInfo, email: e.target.value },
                                  }))
                                }
                                className="mt-1 text-sm"
                                required
                              />
                              {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                            </div>
                            <div className="sm:col-span-2">
                              <Label htmlFor="phone" className="text-sm">
                                {t("eventTickets.userInfo.phoneNo")}
                              </Label>
                              <Input
                                id="phone"
                                placeholder={t("eventTickets.userInfo.phoneNoField")}
                                value={ticketData.customerInfo.phone}
                                onChange={(e) =>
                                  setTicketData((prev) => ({
                                    ...prev,
                                    customerInfo: { ...prev.customerInfo, phone: e.target.value },
                                  }))
                                }
                                className="mt-1 text-sm"
                                required
                              />
                              {fieldErrors.phone_no && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone_no}</p>}
                            </div>

                          </div>
                        </div>

                        <Separator />

                        {/* Payment Method */}
                        {/* <div className="space-y-4">
                          <h3 className="text-base font-semibold text-gray-900">Payment Method</h3>
                          <RadioGroup
                            value={ticketData.paymentMethod}
                            onValueChange={(value) => setTicketData((prev) => ({ ...prev, paymentMethod: value }))}
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {paymentMethods.map((method) => (
                                <div
                                  key={method.id}
                                  className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-amber-200 transition-colors"
                                >
                                  <RadioGroupItem value={method.id} id={method.id} />
                                  <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                                    <div className="flex items-center space-x-2">
                                      <method.icon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                      <div>
                                        <h4 className="font-medium text-gray-900 text-sm">{method.name}</h4>
                                        <p className="text-xs text-gray-600">{method.description}</p>
                                      </div>
                                    </div>
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </RadioGroup>
                        </div> */}

                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <Info className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-blue-800">
                              <p className="font-medium mb-1">{t("eventTickets.userInfo.privacyNotice")}</p>
                              <p>
                                {t("eventTickets.userInfo.privacyNoteDescription")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {errors && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <span className="block sm:inline">{errors}</span>
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-6 border-t">
                      <Button
                        variant="outline"
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className="flex items-center space-x-2 bg-transparent text-sm px-4 py-2"
                      >
                        <ChevronLeft className="w-3 h-3" />
                        <span>{t("eventTickets.ticketCard.previousButton")}</span>
                      </Button>

                      {currentStep < 2 ? (
                        <Button
                          onClick={nextStep}
                          disabled={getTotalTickets() === 0}
                          className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-sm px-4 py-2"
                        >
                          <span>{t("eventTickets.ticketCard.nextButton")}</span>
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      ) : (
                        <Button
                          onClick={handleCompleteBooking}
                          disabled={
                            !ticketData.customerInfo.name ||
                            !ticketData.customerInfo.email ||
                            !ticketData.customerInfo.phone ||

                            isProcessingPayment
                          }
                          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-sm px-4 py-2"
                        >
                          {isProcessingPayment ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>{lang === "am" ? "በማሰናዳት ላይ..." : "Processing..."}</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-3 h-3" />
                              <span>{event?.is_free ? (lang === "am" ? "ምዝገባውን ጨርስ" : "Complete Registration") : t("eventTickets.ticketCard.payButton")}</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Event Summary */}
              <div className="lg:col-span-1">
                <Card className="shadow-sm border border-gray-200 sticky top-4 sm:top-8">
                  <CardHeader>
                    <CardTitle className="text-base text-gray-900">{t("eventTickets.ticketSummary.title")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        <span className="text-gray-600">{t("eventTickets.ticketSummary.date")}</span>
                        <span className="font-medium">{lang === 'am' ? formatEthiopian(new Date(event.dateRaw ?? event.date), { amharic: true }) : event.date}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        <span className="text-gray-600">{t("eventTickets.ticketSummary.time")}</span>
                        <span className="font-medium">{lang === 'am' ? `${formatEthiopianTime(`${event.start_time}`, { clock: 'ethiopian', amharic: true })}-${formatEthiopianTime(`${event.end_time}`, { clock: 'ethiopian', amharic: true })}` : event.time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        <span className="text-gray-600">{t("eventTickets.ticketSummary.location")}</span>
                        <span className="font-medium">{translateField(event, lang, "location")}</span>
                      </div>
                    </div>

                    {getTotalTickets() > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-xs">
                          <Ticket className="w-3 h-3 text-amber-500 flex-shrink-0" />
                          <span className="text-gray-600">{t("eventTickets.ticketSummary.selectedTickets")}</span>
                        </div>
                        <div className="ml-5 space-y-1">
                          {Object.entries(ticketData.ticketSelections).map(([ticketId, quantity]) => {
                            if (quantity === 0) return null

                            const ticket = ticketTypes.find((t) => String(t.id) === String(ticketId))

                            return (
                              <div key={ticketId} className="text-xs text-gray-600 flex justify-between">
                                <span>
                                  {translateField(ticket, lang, "name")} x {quantity}
                                </span>
                                <span className="font-medium">
                                  {((ticket?.price || 0) * quantity).toLocaleString()} {ticket.currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}


                    <Separator />

                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900 text-sm">{t("eventTickets.ticketSummary.total")}</span>
                      <span className="text-lg font-bold text-amber-600">{calculateTotal().toLocaleString()} {t("currency.currencyETB")}</span>
                    </div>

                    <div className="bg-amber-50 p-2 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Info className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-amber-800">
                          <p className="font-medium mb-1">{t("eventTickets.ticketSummary.eventInfoTitle")}</p>
                          <p>{t("eventTickets.ticketSummary.eventInfoDesc")}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}


