"use client"
import { api1, api2 } from "../baseUrl"
import { startOfDay } from "date-fns";
import axios from "axios"
import { useMemo } from "react"
import { CalendarC } from "../components/ui/calendar"
import { useState, useEffect } from "react"
import Navigation from "../components/navigation"
import Footer from "../components/footer"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Separator } from "../components/ui/separator"
import { Checkbox } from "../components/ui/checkbox"
import { useAuth } from '../contexts/auth-context';
import { format } from "date-fns";
import { formatEthiopian } from "@/utils/ethiopianDate";
import {
  Calendar,
  Info,
  Plus,
  Minus,
} from "lucide-react"
import { useTranslation } from 'react-i18next';

import { translateField } from "@/utils/translate";

const addWeeks = (date, weeks) => {
  const result = new Date(date)
  result.setDate(result.getDate() + weeks * 7)
  return result
}

const addMonths = (date, months) => {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}


export default function TicketsPage() {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [currentStep, setCurrentStep] = useState(1)
  const [isVisible, setIsVisible] = useState(false)
  const [error, setErrors] = useState("")
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState({})


  const [bookingData, setBookingData] = useState({
    date: "",
    timeSlot: "",
    ticketQuantities: {
    },
    additionalServices: {},
    userType: "",
    paymentMethod: "",
  })
  const [groupInfo, setGroupInfo] = useState({
    group_name: "",
    group_leader_email: "",
    total_members: 0,
  });



  //updated one
  const [ticketTypes, setTicketTypes] = useState([]);
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    email: "",
    visit_date: "",
    ticketSelections: [],       // [{ ticket_id, quantity }]
    serviceSelections: [],      // [{ service_id, quantity }]
    isGroup: false,
    groupSize: 0,
    groupName: "",
    groupLeaderEmail: "",
  });

  const [groupDiscounts, setGroupDiscounts] = useState([])             // ADDED
  const [discountCalc, setDiscountCalc] = useState({                   // ADDED
    baseTotal: 0,
    totalDiscount: 0,
    finalTotal: 0,
    perTicket: []
  })

  // Fetch group discounts (once)
  useEffect(() => {
    fetch(`${api1}/group-discounts`)
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : (d.data || [])
        setGroupDiscounts(list)
      })
      .catch(err => console.error("Group discounts fetch error:", err))
  }, []);


  useEffect(() => {
    fetch(`${api1}/tickets/types`)
      .then(res => res.json())
      .then(data => setTicketTypes(data))  // ✅ fixed
      .catch(console.error);


  }, []);


  useEffect(() => {
    setErrors("")
  }, bookingData);






  function calculateTotal() {
    let total = 0;

    // Ticket total
    for (const ticket of ticketTypes) {
      const qty = bookingData.ticketQuantities?.[ticket.ticket_id] || 0;
      total += qty * ticket.price;
    }


    return total;
  }

  const isGroupEligible = () => {
    return ticketTypes.some(ticket => {
      const min = ticket.groupMinSize || 0;
      const selection = formData.ticketSelections.find(t => t.ticket_id === ticket.ticket_id);
      const qty = selection ? selection.quantity : 0;
      return qty >= min && min > 0;
    });
  };




  useEffect(() => {
    setIsVisible(true)
  }, [])
  // Scroll to progress steps section when step changes
  useEffect(() => {
    const progressSection = document.getElementById("progress-steps")
    if (progressSection) {
      progressSection.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [currentStep])

  function getTotalVisitors() {
    return Object.values(bookingData.ticketQuantities).reduce((acc, qty) => acc + qty, 0);
  }





  const updateTicketQuantity = (ticketId, delta) => {
    // Get the ticket being modified
    const selectedTicket = ticketTypes.find(t => t.ticket_id === ticketId);
    if (!selectedTicket) return;

    // Check if user is trying to add a ticket (delta > 0)
    if (delta > 0) {
      // Get currently selected tickets with their currencies
      const currentSelections = Object.entries(bookingData.ticketQuantities || {})
        .filter(([_, quantity]) => quantity > 0)
        .map(([id, _]) => ticketTypes.find(t => t.ticket_id === parseInt(id)))
        .filter(Boolean);

      // If there are already selected tickets, check currency compatibility
      if (currentSelections.length > 0) {
        const existingCurrency = currentSelections[0].currency;

        // Check if the new ticket has a different currency
        if (selectedTicket.currency !== existingCurrency) {
          const existingTicketName = translateField(currentSelections[0], lang, "type");
          const newTicketName = translateField(selectedTicket, lang, "type");

          setErrors(
            lang === "am"
              ? `የተለያዩ አይነት ገንዘቦች ማዋሃድ አይቻልም። የ${existingTicketName} ትኬቶች (${existingCurrency}) እና የ${newTicketName} ትኬቶች (${selectedTicket.currency}) በአንድ ጊዜ መግዛት አይቻልም። እባክዎ ያሁኑን ትኬቶች ያስወግዱ ወይም የተመሳሳይ አይነት ገንዘብ ያላቸውን ትኬቶች ይምረጡ።`
              : `Cannot mix different currencies. You cannot purchase ${existingTicketName} tickets (${existingCurrency}) and ${newTicketName} tickets (${selectedTicket.currency}) at the same time. Please remove existing tickets or select tickets with the same currency type.`
          );
          return; // Block the operation
        }
      }
    }

    // If validation passes, proceed with the update
    setBookingData((prev) => {
      const prevQuantity = prev.ticketQuantities[ticketId] || 0;
      const newQuantity = Math.max(0, prevQuantity + delta);
      return {
        ...prev,
        ticketQuantities: {
          ...prev.ticketQuantities,
          [ticketId]: newQuantity,
        },
      };
    });

    // Clear any previous currency errors when successfully adding tickets
    if (delta > 0) {
      setErrors("");
    }
  };

  // ADDED: best discount percent for a ticket/quantity
  const getTicketDiscountPercent = (ticket_id, quantity) => {
    if (!quantity) return 0
    const applicable = groupDiscounts.filter(gd => gd.ticket_id === ticket_id && quantity >= gd.min_group_size)
    if (!applicable.length) return 0
    return applicable.reduce((max, gd) => gd.discount_percent > max ? gd.discount_percent : max, 0)
  }

  // ADDED: recompute discounts whenever quantities or discounts change
  useEffect(() => {
    if (!ticketTypes.length) return
    const perTicket = []
    let base = 0
    let discountSum = 0

    // Index discounts by ticket_id
    const discMap = groupDiscounts.reduce((m, d) => {
      (m[d.ticket_id] ||= []).push(d)
      return m
    }, {})

    for (const t of ticketTypes) {
      const qty = bookingData.ticketQuantities?.[t.ticket_id] || 0
      if (qty <= 0) continue
      const lineBase = t.price * qty
      base += lineBase
      const rules = discMap[t.ticket_id] || []
      let best = 0
      for (const r of rules) {
        if (qty >= r.min_group_size && r.discount_percent > best) {
          best = Number(r.discount_percent)
        }
      }
      const lineDiscount = best ? (lineBase * best) / 100 : 0
      discountSum += lineDiscount
      perTicket.push({
        ticket_id: t.ticket_id,
        quantity: qty,
        unit_price: t.price,
        discount_percent: best,
        discount_amount: lineDiscount,
        final: lineBase - lineDiscount
      })
    }
    setDiscountCalc({
      baseTotal: base,
      totalDiscount: discountSum,
      finalTotal: base - discountSum,
      perTicket
    })
  }, [bookingData.ticketQuantities, ticketTypes, groupDiscounts])


  // ADDED: helper for display
  const formatETB = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })


  const handlePay = async () => {
    setLoading(true)
    setErrors(null)

    const safeDiscount = discountCalc || { baseTotal: calculateTotal(), totalDiscount: 0, finalTotal: calculateTotal(), perTicket: [] }

    const payload = {
      title: "ticket booking",
      visit_date: bookingData.date
        ? bookingData.date//new Date(bookingData.date).toLocaleDateString()
        : null,
      email: isAuthenticated ? user.email : formData.email,
      isGroup: formData.isGroup || false,
      ticketTypes: Object.entries(bookingData.ticketQuantities || {})
        .filter(([_, qty]) => qty > 0)
        .map(([ticket_id, quantity]) => ({ ticket_id, quantity })),
      services: Object.entries(bookingData.additionalServices || {})
        .filter(([_, qty]) => qty > 0)
        .map(([service_id, quantity]) => ({ service_id: parseInt(service_id), quantity })),
      discounts: {
        base_total: safeDiscount.baseTotal,
        total_discount: safeDiscount.totalDiscount,
        final_total: safeDiscount.finalTotal,
        lines: safeDiscount.perTicket.map(l => ({
          ticket_id: l.ticket_id,
          quantity: l.quantity,
          discount_percent: l.discount_percent,
          discount_amount: l.discount_amount,
          final_line_total: l.final
        }))
      }
    }

    if (payload.isGroup) {
      const totalSelected = getTotalVisitors();

      if (!groupInfo.group_name?.trim()) {
        setErrors(lang === "am" ? "የቡድን ስም ያስፈልጋል" : "Group name is required");
        setLoading(false);
        return;
      }

      if (!groupInfo.group_leader_email?.trim()) {
        setErrors(lang === "am" ? "የቡድን አለቃ ኢሜይል ያስፈልጋል" : "Group leader email is required");
        setLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(groupInfo.group_leader_email)) {
        setErrors(lang === "am" ? "የቡድን አለቃ ኢሜይል ቅርጸ ቁምፊ የተሳሳተ ነው" : "Invalid group leader email format");
        setLoading(false);
        return;
      }

      if (totalSelected <= 0) {
        setErrors(lang === "am" ? "ለቡድን ቦታ ቢያንስ አንድ ትኬት ይምረጡ" : "Select at least one ticket for group booking");
        setLoading(false);
        return;
      }

      if (Number(groupInfo.total_members) !== totalSelected) {
        setErrors(
          lang === "am"
            ? `የቡድን አባላት ብዛት ከተመረጡት ትኬቶች (${totalSelected}) ጋር መማር አለበት።`
            : `Total group members must equal total selected tickets (${totalSelected}).`
        );
        setLoading(false);
        return;
      }

      payload.group = {
        group_name: groupInfo.group_name,
        group_leader_email: groupInfo.group_leader_email,
        total_members: Number(groupInfo.total_members),
      };
      payload.email = groupInfo.group_leader_email;
    }


    // Validation
    if (!bookingData.date || isNaN(new Date(bookingData.date).getTime())) {
      setErrors(lang === "am"
        ? `እባክዎ ቀን ይምረጡ።`
        : `Select visit date.`);
      setLoading(false);
      return;
    }

    if (!payload.email) {
      setErrors(lang === "am"
        ? `እባክዎ ኢሜይል ያስገቡ።`
        : `Please enter the email.`);
      setLoading(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      setErrors(lang === "am"
        ? `ትክክለኛ ኢሜይል ያስገቡ።`
        : `Please enter valid email`);
      setLoading(false);
      return;
    }
    if (payload.ticketTypes.length === 0) {
      setErrors("Select at least one ticket");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${api1}/initiate/telebirr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result?.checkout_url) {
        window.location.href = result.checkout_url;
      } else {
        alert("Failed to initiate payment. Please try again.");
      }
    } catch (error) {
      console.error("Payment initiation failed:", error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };


  //******unavailable dates starts here*****

  useEffect(() => {
    const fetchUnavailableDates = async () => {
      try {
        const response = await axios.get(`${api1}/admin/schedule/6`);
        const data = response.data;

        const formattedData = {};

        Object.entries(data).forEach(([date, details]) => {
          formattedData[date] = {
            id: details.id,
            date: new Date(date),
            fullDay: details.time_slots.length === 0,
            timeSlots: details.time_slots.map(slot => ({
              id: slot.id,
              slot_id: slot.id,
              startTime: slot.start_time,
              endTime: slot.end_time,
            })),
            recurrence: details.weekly_recurrence
              ? "weekly"
              : details.monthly_recurrence
                ? "monthly"
                : "none",
            recurringDetails: {
              duration: details.weekly_recurrence || details.monthly_recurrence || 1,
            },
          };
        });

        setUnavailableDates(formattedData);
      } catch (error) {
        console.error("Error fetching unavailable dates:", error);
      }
    };

    fetchUnavailableDates();
  }, []);

  // Generate all recurring dates for display
  const getAllRecurringDates = useMemo(() => {
    const allDates = new Set();

    Object.values(unavailableDates).forEach((dateData) => {
      const baseDate = startOfDay(new Date(dateData.date));
      allDates.add(baseDate.getTime());

      if (dateData.recurrence !== "none" && dateData.recurringDetails?.duration) {
        const { duration } = dateData.recurringDetails;

        for (let i = 1; i < duration; i++) {
          let nextDate;
          if (dateData.recurrence === "weekly") {
            nextDate = startOfDay(addWeeks(baseDate, i));
          } else if (dateData.recurrence === "monthly") {
            nextDate = startOfDay(addMonths(baseDate, i));
          }

          if (nextDate) {
            allDates.add(nextDate.getTime());
          }
        }
      }
    });

    // Convert Set of timestamps back to Date objects
    return Array.from(allDates).map((timestamp) => new Date(timestamp));
  }, [unavailableDates]);

  const handleSelect = (dates) => {
    console.log("Selected date:", dates);
    const formattedDate = format(new Date(dates), "yyyy-MM-dd");
    console.log("Formatted date:", formattedDate);
    setBookingData((prev) => ({ ...prev, date: formattedDate }))
  }

  // *****unavailable dates ends here***** 


  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <section className="bg-white text-white py-8 sm:py-16 pt-20 sm:pt-32">
        <div className="container mx-auto px-4 sm:px-6">
          <div
            className={`text-center transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}
          >
            <h1 className="font-eb-garamond text-3xl sm:text-4xl lg:text-5xl text-amber-500 mb-4">{t("tickets.title")}</h1>
            <div className="w-16 sm:w-24 h-px bg-amber-400 mx-auto mb-4 sm:mb-6"></div>
            <p className="text-gray-900 text-base sm:text-lg max-w-2xl mx-auto">
              {t("tickets.description")}
            </p>
          </div>
        </div>
      </section>

      {/* Progress Steps */}
      {/* Main Content */}
      <section className="py-6 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Main Form */}
              <div className="lg:col-span-2">
                <Card className="shadow-sm border border-gray-200">
                  <CardContent className="p-4 sm:p-6">
                    {/* Step 1: Date & Time + Tickets + Services */}
                    {currentStep === 1 && (
                      <div className="space-y-6 sm:space-y-8">
                        {/* Date & Time Selection */}
                        <div className="space-y-4 sm:space-y-6">
                          <div>
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">{t("tickets.ticketCard.title")}</h2>
                            <p className="text-gray-600 text-sm sm:text-base">
                              {t("tickets.ticketCard.description")}
                            </p>
                          </div>

                          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                            {/* Calendar Section */}
                            <div>
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4"> {t("tickets.ticketCard.selectDate")}</h3>
                              <Card>
                                <CardContent>
                                  <CalendarC
                                    mode="single"
                                    selected={bookingData.date ? new Date(bookingData.date) : null}
                                    onSelect={handleSelect}
                                    disabled={(date) => {
                                      const isPast = date < new Date().setHours(0, 0, 0, 0)
                                      const isUnavailable = getAllRecurringDates.some((d) =>
                                        d.toDateString() === date.toDateString()
                                      )
                                      return isPast || isUnavailable
                                    }}
                                    modifiers={{
                                      unavailable: getAllRecurringDates,
                                    }}
                                    calendar={lang === 'am' ? 'ethiopian' : 'gregorian'}
                                    locale={lang}
                                    modifiersStyles={{
                                      unavailable: {
                                        backgroundColor: "#fee2e2",
                                        color: "#dc2626",
                                        cursor: "not-allowed",
                                      },
                                    }}
                                  />
                                  <div className="mt-4 flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                                      <span> {t("tickets.ticketCard.unavialableDates")}</span>
                                    </div>
                                    <span className="text-gray-500"> {t("tickets.ticketCard.total")} {getAllRecurringDates.length}  {t("tickets.ticketCard.unavialableDates")}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        </div>

                        <Separator />
                        {!isAuthenticated && !formData.isGroup && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-base font-medium">
                                {t("tickets.ticketCard.individualEmail")}
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                placeholder={t("tickets.ticketCard.individualEmailField")}
                                value={formData.email}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    email: e.target.value.trimStart(), // trim only start to avoid accidental leading spaces
                                  }))
                                }
                                className="w-full"
                                required
                                autoComplete="email"
                                spellCheck={false}
                              />
                            </div>
                            <Separator />
                          </>
                        )}

                        {/* Group Purchase Option */}
                        <div className="space-y-4">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id="group-purchase"
                                checked={Boolean(formData.isGroup)}
                                onCheckedChange={(checked) =>
                                  setFormData((prev) => ({ ...prev, isGroup: Boolean(checked) }))
                                }
                                className="w-5 h-5"
                              />
                              <Label htmlFor="group-purchase" className="text-base font-medium">
                                {t("tickets.ticketCard.groupPurchase")}
                              </Label>
                            </div>
                            <p className="text-xs text-gray-500 ml-8">
                              {t("tickets.ticketCard.groupPurchaseDescription")}
                            </p>
                          </div>

                          {formData.isGroup && (
                            <div className="space-y-4">
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="flex items-start space-x-2">
                                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <div className="text-sm text-blue-800">
                                    <p className="font-medium mb-1"> {t("tickets.ticketCard.groupDiscInfo")}</p>
                                    <ul className="space-y-1">
                                      {ticketTypes
                                        .filter((t) => t.groupMinSize)
                                        .map((ticket) => (
                                          <li key={ticket.id}>
                                            • {ticket.name}: {ticket.groupDiscountPercent}% off for groups of {ticket.groupMinSize}+
                                          </li>
                                        ))}
                                    </ul>
                                    {!isGroupEligible() && (
                                      <p className="text-amber-700 mt-2 font-medium">
                                        {t("tickets.ticketCard.groupWarning")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Group Information Form */}
                              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900"> {t("tickets.ticketCard.groupInfo")}</h3>

                                <div className="grid md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="group-name" className="text-sm font-medium">
                                      {t("tickets.ticketCard.groupName")}
                                    </Label>
                                    <Input
                                      id="group-name"
                                      type="text"
                                      placeholder={t("tickets.ticketCard.groupNameField")}
                                      value={groupInfo.group_name}
                                      onChange={(e) =>
                                        setGroupInfo((prev) => ({
                                          ...prev,
                                          group_name: e.target.value.trimStart(),
                                        }))
                                      }
                                      className="w-full"
                                      required
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="group-leader-email" className="text-sm font-medium">
                                      {t("tickets.ticketCard.groupLeaderEmail")}
                                    </Label>
                                    <Input
                                      id="group-leader-email"
                                      type="email"
                                      placeholder={t("tickets.ticketCard.groupLeaderField")}
                                      value={groupInfo.group_leader_email}
                                      onChange={(e) =>
                                        setGroupInfo((prev) => ({
                                          ...prev,
                                          group_leader_email: e.target.value.trimStart(),
                                        }))
                                      }
                                      className="w-full"
                                      required
                                      autoComplete="email"
                                      spellCheck={false}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="total-members" className="text-sm font-medium">
                                    {t("tickets.ticketCard.totalMembers")}
                                  </Label>
                                  <Input
                                    id="total-members"
                                    type="number"
                                    min="1"
                                    max="100"
                                    placeholder="Enter total number of group members"
                                    onKeyDown={(e) => {
                                      if (e.key === '-' || e.key === 'e') {
                                        e.preventDefault();
                                      }
                                    }}
                                    value={groupInfo.total_members ?? ""}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/[^\d]/g, '');
                                      setGroupInfo((prev) => ({
                                        ...prev,
                                        total_members: val,
                                      }))
                                    }}
                                    className="w-full max-w-xs"
                                    required
                                  />
                                  <p className="text-xs text-gray-600">
                                    {t("tickets.ticketCard.totalMembersInfo")}
                                  </p>

                                  {formData.isGroup && Number(groupInfo.total_members) !== getTotalVisitors() && (
                                    <p className="text-sm text-red-600 mt-1">
                                      {t("tickets.ticketCard.totalMembersWarning")} ({getTotalVisitors()}).
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>


                        {/* Available Tickets Section */}
                        <div className="space-y-4 sm:space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{t("tickets.ticketCard.availableTickets")}</h2>
                            {(() => {
                              // Get current currency selection
                              const currentSelections = Object.entries(bookingData.ticketQuantities || {})
                                .filter(([_, quantity]) => quantity > 0)
                                .map(([id, _]) => ticketTypes.find(t => t.ticket_id === parseInt(id)))
                                .filter(Boolean);

                              if (currentSelections.length > 0) {
                                const currency = currentSelections[0].currency;
                                return (
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-blue-100 text-blue-800 px-3 py-1 text-sm">
                                      {lang === "am" ? "የተመረጠ ገንዘብ" : "Selected Currency"}: {currency}
                                    </Badge>
                                    <p className="text-xs text-gray-600">
                                      {lang === "am"
                                        ? "የተመሳሳይ አይነት ገንዘብ ያላቸውን ትኬቶች ብቻ መግዛት ይችላሉ"
                                        : "You can only purchase tickets with the same currency"
                                      }
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>

                          <div className="space-y-3 sm:space-y-4">
                            {ticketTypes.map((ticket) => {
                              const quantity = bookingData.ticketQuantities?.[ticket.ticket_id] || 0;
                              console.log("quantity", quantity)

                              // Check if this ticket is compatible with current currency selection
                              const currentSelections = Object.entries(bookingData.ticketQuantities || {})
                                .filter(([_, qty]) => qty > 0)
                                .map(([id, _]) => ticketTypes.find(t => t.ticket_id === parseInt(id)))
                                .filter(Boolean);

                              const isCompatible = currentSelections.length === 0 ||
                                currentSelections[0].currency === ticket.currency;

                              return (
                                (ticket.status.toLowerCase() === "active") &&
                                <div
                                  key={ticket.ticket_id}
                                  className={`border rounded-lg p-3 sm:p-4 transition-colors ${!isCompatible
                                    ? "border-red-200 bg-red-50 opacity-60"
                                    : "border-gray-200 hover:border-amber-300"
                                    }`}
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                          {translateField(ticket, lang, "type")}
                                        </h3>
                                        <Badge className="bg-amber-100 text-amber-800 px-2 py-1 text-xs sm:text-sm w-fit">
                                          {ticket.price} {ticket.currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")}
                                        </Badge>
                                      </div>
                                      <p className="text-gray-600 text-xs sm:text-sm mb-3">
                                        {translateField(ticket, lang, "description")}
                                      </p>

                                      {/* Feature Tags */}
                                      {/* <div className="flex flex-wrap gap-1 sm:gap-2">
                                        {ticket.feature?.map((f, index) => (
                                          <Badge
                                            key={index}
                                            variant="outline"
                                            className="bg-gray-50 text-gray-700 border-gray-300 text-xs px-2 py-1"
                                          >
                                            {f}
                                          </Badge>
                                        ))}
                                      </div> */}
                                      {ticket.feature && (
                                        <div className="flex flex-wrap gap-1 sm:gap-2">
                                          {ticket.feature.split(',').map((f, index) => (
                                            <Badge
                                              key={index}
                                              variant="outline"
                                              className="bg-gray-50 text-gray-700 border-gray-300 text-xs px-2 py-1"
                                            >
                                              {translateField({ feature: f.trim(), feature_am: ticket.feature_am?.split(',')[index]?.trim() }, lang, "feature")}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}

                                    </div>
                                  </div>

                                  {/* Quantity Controls */}
                                  <div className="flex items-center justify-end space-x-3">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateTicketQuantity(ticket.ticket_id, -1)}
                                      disabled={quantity <= 0}
                                      className="w-8 h-8 p-0 border-gray-300 hover:border-amber-500"
                                    >
                                      <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </Button>
                                    <span className="text-base sm:text-lg font-semibold text-gray-900 min-w-[2rem] text-center">
                                      {quantity}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateTicketQuantity(ticket.ticket_id, 1)}
                                      disabled={quantity >= (ticket.daily_limit ? ticket.daily_limit : 1000) || !isCompatible}
                                      className={`w-8 h-8 p-0 ${!isCompatible
                                        ? "border-red-300 text-red-400 cursor-not-allowed"
                                        : "border-amber-500 text-amber-600 hover:bg-amber-50"
                                        }`}
                                      title={
                                        !isCompatible
                                          ? (lang === "am"
                                            ? "የተለያዩ አይነት ገንዘብ ማዋሃድ አይቻልም"
                                            : "Cannot mix different currencies")
                                          : ""
                                      }
                                    >

                                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </Button>

                                  </div>

                                  {/* Show currency incompatibility message */}
                                  {!isCompatible && currentSelections.length > 0 && (
                                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                                      <p className="text-xs text-red-700">
                                        {lang === "am"
                                          ? `ይህ ትኬት ${ticket.currency} ውስጥ ነው፣ ነገር ግን የተመረጡት ትኬቶች ${currentSelections[0].currency} ውስጥ ናቸው። የተመሳሳይ አይነት ገንዘብ ያላቸውን ትኬቶች ብቻ መግዛት ይችላሉ።`
                                          : `This ticket is in ${ticket.currency}, but your selected tickets are in ${currentSelections[0].currency}. You can only purchase tickets with the same currency type.`
                                        }
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>


                        <Separator />



                      </div>
                    )}
                    {/* Navigation Buttons */}
                  </CardContent>
                </Card>
              </div>

              {/* Event Summary */}
              <div className="lg:col-span-1">


                <Card className="shadow-sm border border-gray-200 lg:sticky lg:top-1/2 lg:-translate-y-1/2 mt-6">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg text-gray-900">{t("tickets.bookingSummary.title")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    {bookingData.date && (
                      <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
                        <span className="text-gray-600">{t("tickets.bookingSummary.date")}</span>
                        <span className="font-medium">
                          {bookingData.date
                            ? (lang === "am"
                              ? formatEthiopian(new Date(bookingData.date), { amharic: true })
                              : new Date(bookingData.date).toLocaleDateString())
                            : "-"}
                        </span>
                      </div>
                    )}

                    {getTotalVisitors && getTotalVisitors() > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs sm:text-sm font-medium text-gray-700">{t("tickets.bookingSummary.tickets")}</div>

                        {ticketTypes.map((ticket) => {
                          const quantity = bookingData.ticketQuantities?.[ticket.ticket_id] || 0;
                          if (quantity === 0) return null;

                          return (
                            <div key={ticket.ticket_id} className="flex justify-between text-xs sm:text-sm ml-3 sm:ml-4">
                              <span className="text-gray-600">{quantity}x {translateField(ticket, lang, "type")}</span>
                              <span className="font-medium">{(quantity * ticket.price).toLocaleString()} {ticket.currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}




                    {/* ADDED: per-ticket discount display */}
                    {discountCalc.perTicket.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-700">{t("tickets.bookingSummary.discount")}</div>
                        {discountCalc.perTicket.map(line => (
                          line.discount_percent > 0 && (
                            <div key={line.ticket_id} className="flex justify-between text-[11px] sm:text-xs ml-3 sm:ml-4 text-green-700">
                              <span>
                                {line.quantity}x {translateField(ticketTypes.find(t => t.ticket_id === line.ticket_id), lang, 'type')} @ {line.discount_percent}%
                              </span>

                              <span>-{formatETB(line.discount_amount)} {t("currency.currencyETB")}</span>
                            </div>
                          )
                        ))}
                      </div>
                    )}

                    {/* ADDED: totals block */}
                    <Separator />
                    {/* Discount Summary (ADDED) */}
                    {discountCalc.perTicket.length > 0 && discountCalc.totalDiscount > 0 && (
                      <div className="space-y-1 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t("tickets.bookingSummary.baseTotal")}</span>
                          <span>{discountCalc.baseTotal.toLocaleString()} {t("currency.currencyETB")}</span>
                        </div>
                        {discountCalc.perTicket.filter(p => p.discount_percent > 0).map(line => (
                          <div key={line.ticket_id} className="flex justify-between text-green-700">
                            <span>{line.quantity}x {translateField(ticketTypes.find(t => t.ticket_id === line.ticket_id), lang, 'type')} @ {line.discount_percent}%</span>
                            <span>-{line.discount_amount.toLocaleString()} {t("currency.currencyETB")}</span>
                          </div>
                        ))}
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t("tickets.bookingSummary.discountBase")}</span>
                          <span className="text-green-600">
                            -{discountCalc.totalDiscount.toLocaleString()} {t("currency.currencyETB")}
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>{t("tickets.bookingSummary.fineTotal")}</span>
                          <span>{discountCalc.finalTotal.toLocaleString()} {t("currency.currencyETB")}</span>
                        </div>
                      </div>
                    )}
                    {/* Grand Total (fallback if no discount) */}
                    <div className="flex justify-between font-semibold text-sm sm:text-base">
                      <span>{t("tickets.bookingSummary.total")}</span>
                      <span>
                        {(discountCalc.finalTotal || calculateTotal()).toLocaleString()} {t("currency.currencyETB")}
                      </span>
                    </div>
                    <div className="mt-4">
                      {error && (
                        <p className="mt-2 text-sm text-red-600" role="alert" aria-live="assertive">
                          {error}
                        </p>
                      )}
                      <Button
                        disabled={loading || (formData.isGroup && Number(groupInfo.total_members) !== getTotalVisitors())}
                        onClick={handlePay}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        {loading
                          ? (lang === "am" ? "በሂደት ላይ..." : "Processing...")
                          : `${lang === "am" ? "ክፍያ" : "Pay"} ${(discountCalc.finalTotal || calculateTotal()).toLocaleString()} ${t("currency.currencyETB")}`}

                      </Button>
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


