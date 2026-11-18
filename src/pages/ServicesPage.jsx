"use client"

import axios from '../services/axiosInstance.js'
import { useAuth } from "../contexts/auth-context"
import { useState, useEffect, useMemo, useRef } from "react"
import Navigation from "@/components/navigation"
import { toast } from "react-toastify"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Switch } from "../components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  X,
  Plus,
  Trash2,
  Users,
  Clock,
  ArrowRight,
  CheckCircle,
  ChevronLeft,
  CalendarDays,
  ChevronRight,
  Building,
  Crown,
  Presentation,
  AlertCircle,
  CreditCard,
  Home,
  Eye,
  MapPin,
  Star,

} from "lucide-react"
import { format } from "date-fns"
import { formatEthiopian } from "@/utils/ethiopianDate"
import { cn } from "@/lib/utils"
import { CalendarC as CalendarComponent } from "../components/ui/calendar"
import { startOfDay } from "date-fns"
import { motion } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next";
import { translateField } from "@/utils/translate";

function StepInfo({ children, info }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="ml-2 cursor-pointer text-amber-500">ℹ️</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm">
          <p>{info}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
// (removed stray closing brace)



const convertTo12Hour = (time24) => {
  const [hour, minute] = time24.split(":").map(Number)
  const period = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`
}
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

// Helper: convert "HH:mm:ss" or "HH:mm" to total minutes
function toMinutes(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(":").map(Number)
  return h * 60 + (m || 0)
}

function isValidEventRange(start, end, unavailableTimeSlots) {
  const startMinutes = toMinutes(start)
  const endMinutes = toMinutes(end)

  if (endMinutes <= startMinutes) {
    return false // End must be after start
  }

  for (const slot of unavailableTimeSlots) {
    const slotStart = toMinutes(slot.startTime)
    const slotEnd = toMinutes(slot.endTime)

    // Overlap condition: [start, end) intersects with [slotStart, slotEnd)
    if (startMinutes < slotEnd && endMinutes > slotStart) {
      return false
    }
  }

  return true
}

function generateTimeOptions(unavailableTimeSlots, type = "start") {
  // Generate all 24h times (every 30 min)
  const allTimes = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, "0")
      const mm = String(m).padStart(2, "0")
      allTimes.push(`${hh}:${mm}:00`)
    }
  }

  // Mark unavailable times first
  const blocked = new Set()

  unavailableTimeSlots.forEach((slot) => {
    const { startTime, endTime } = slot
    const startIndex = allTimes.indexOf(startTime)
    const endIndex = allTimes.indexOf(endTime)

    if (startIndex !== -1 && endIndex !== -1) {
      for (let i = startIndex; i < endIndex; i++) {
        // block start ≤ i < end for start times
        blocked.add(i)
      }
      if (type === "end") {
        blocked.add(endIndex) // block the actual end for endTimes
      }
    }
  })

  // Filter out blocked indices
  const available = allTimes.filter((_, idx) => !blocked.has(idx))

  // Convert to 12h format
  return available.map((time) => {
    const [h, m] = time.split(":").map(Number)
    const period = h >= 12 ? "PM" : "AM"
    const hour12 = h % 12 || 12
    return {
      value: time, // raw 24h
      label: `${hour12}:${m.toString().padStart(2, "0")} ${period}`, // pretty
    }
  })
}


export default function ServicesPage() {
  const { i18n } = useTranslation();
  const { t } = useTranslation();


  // Custom tab change handler to allow switching to 'my-bookings' when editing
  const bookingCardRef = useRef(null)
  const { isAuthenticated, user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);




  const handleTabChange = (v) => {
    if (editingRequest && v === "book-service") {
      // Stay in book-service, keep lockBack logic
      setTabValue("book-service")
    } else {
      setTabValue(v)
    }
  }
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedService, setSelectedService] = useState("")
  const [selectedFacility, setSelectedFacility] = useState(null)

  // // Facility select handler with auth check
  // const handleFacilitySelect = (facility) => {
  //   if (!isAuthenticated) {
  //     setShowAuthDialog(true);
  //     return;
  //   }
  //   setSelectedFacility(facility);
  // };

  const [showFacilityDetail, setShowFacilityDetail] = useState(false)
  const [selectedFacilityDetail, setSelectedFacilityDetail] = useState(null)
  const [selectedDates, setSelectedDates] = useState([])
  const [scheduleDates, setScheduleDates] = useState({})
  const [fieldErrors, setFieldErrors] = useState({})
  const [upErrors, setUpErrors] = useState({})
  const [editingRequest, setEditingRequest] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all")

  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [selectedAddons, setSelectedAddons] = useState([])
  const [requests, setRequests] = useState([])
  const [unavailableDates, setUnavailableDates] = useState({})
  const [toBeDeleted, setToBeDeleted] = useState([])
  const [slotDelete, setSlotDelete] = useState([])
  const [venueId, setVenueId] = useState()
  const [venues, setVenues] = useState([])
  const [formData, setFormData] = useState({
    organizationName: "",
    contactPerson: "",
    email: "",
    phoneNo: "",
    expectedAttendees: "",
    venue: "",
    category: "",
    attachment: null,
    file: "",
    area_sqm: ""
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [slipFiles, setSlipFiles] = useState({})
  const [isUploadingSlip, setIsUploadingSlip] = useState({})



  const scrollToBookingCard = () => {
    const element = document.getElementById("book-service");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Controlled tab value so handlers can switch tabs programmatically
  const [tabValue, setTabValue] = useState("book-service")
  // When true, prevent moving back to previous steps (used while editing a draft)
  const [lockBack, setLockBack] = useState(false)

  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    booking: null,
  })
  const [paymentData, setPaymentData] = useState({
    paymentMethod: "",
    phoneNumber: "",
    otp: "",
    isProcessing: false,
    isSuccess: false,
    otpSent: false,
    otpCountdown: 0,
  })

  const handleFieldErrors = (errorsArray) => {
    const newErrors = {
      organizationName: "",
      contactPerson: "",
      email: "",
      phoneNo: "",
      expectedAttendees: "",
      attachment: null,
    }

    errorsArray.forEach((err) => {
      if (err.path in newErrors) {
        newErrors[err.path] = err.msg
      }
    })
    setFieldErrors((prev) => ({ ...prev, ...newErrors }))
  }

  const handleUpErrors = (errorsArray) => {
    const newErrors = {
      org_name: "",
      contact_person: "",
      email: "",
      phone_no: "",
      exp_attendees: "",
      attachment: null,
    }

    errorsArray.forEach((err) => {
      if (err.path in newErrors) {
        newErrors[err.path] = err.msg
      }
    })
    setUpErrors((prev) => ({ ...prev, ...newErrors }))
  }

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [serviceCategories, setServiceCategories] = useState([])

  useEffect(() => {
    fetchFacilities()
  }, [])

  const fetchFacilities = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/facilities/front")
      setFacilities(response.data)

      setServiceCategories(buildServiceCategories(response.data))
    } catch (err) {
      setError("Failed to load facilities. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  // Transform backend facilities to serviceCategories format
  const buildServiceCategories = (facilities) => {
    const categoriesMap = {}
    facilities.forEach(facility => {
      const catId = facility.category_id?.toString()
      if (!categoriesMap[catId]) {
        categoriesMap[catId] = {
          id: catId,
          name: facility.category,
          name_am: facility.category_am,
          icon: getCategoryIcon(facility.category), // helper below
          description: facility.sdescription,
          description_am: facility.sdescription_am,
          facilities: []
        }
      }
      categoriesMap[catId].facilities.push({
        id: facility.id?.toString(),
        name: facility.venue,
        name_am: facility.venue_am,
        capacity: facility.capacity,
        price_half_day: facility.price_half_day,
        price_full_day: facility.price_full_day,
        image: facility.image,
        features: facility.features,
        features_am: facility.features_am,
        currency: facility.currency,
        venue_id: facility.venue_id,
        category_id: facility.category_id,
        category: facility.category,
        category_am: facility.category_am,
        description: facility.description,
        description_am: facility.description_am,
        video: facility.video,
        price_per_sqm: facility.price_per_sqm

      })
    })
    return Object.values(categoriesMap)
  }

  // Helper to map category name to icon
  function getCategoryIcon(categoryName) {
    if (!categoryName) return Building
    const name = categoryName.toLowerCase()
    if (name.includes("venue")) return Building
    if (name.includes("premium")) return Crown
    if (name.includes("education")) return Presentation
    if (name.includes("visitor")) return Home
    return Building
  }


  const fetchRequests = async () => {
    try {
      if (!user || !user.email) return;

      const result = await axios.get("/user/service-request");
      setRequests(result.data);
    } catch (err) {
      toast.error("error when fetching requests");
    }
  };

  useEffect(() => {
    fetchRequests();
    // Only refetch when user changes, not on every requests update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests, user]);


  const handleSlipFileChange = (bookingId, file) => {
    setSlipFiles(prev => ({ ...prev, [bookingId]: file }))
  }

  const handleSlipUpload = async (bookingId) => {
    const file = slipFiles[bookingId]
    if (!file) {
      toast.error("Please select a file first")
      return
    }

    const uploadData = new FormData()
    uploadData.append("paymentSlip", file)

    setIsUploadingSlip(prev => ({ ...prev, [bookingId]: true }))
    try {
      await axios.post(`/user/service-request/upload-slip/${bookingId}`, uploadData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      toast.success("Payment slip uploaded successfully!")
      fetchRequests()
      // Clear file for this booking
      setSlipFiles(prev => {
        const next = { ...prev }
        delete next[bookingId]
        return next
      })
    } catch (err) {
      console.error("Upload error:", err)
      toast.error(err.response?.data?.error || "Failed to upload payment slip")
    } finally {
      setIsUploadingSlip(prev => ({ ...prev, [bookingId]: false }))
    }
  }

  // Fetch unavailable dates whenever venueId changes
  const fetchUnavailableDates = async () => {

    if (!venueId) return // only fetch if venueId is set
    try {
      const response = await axios.get(`/user/schedule/${venueId}`)
      const data = response.data

      const formattedData = {}

      Object.entries(data).forEach(([date, details]) => {
        formattedData[date] = {
          id: details.id,
          date: new Date(date),
          fullDay: details.time_slots.length === 0,
          timeSlots: details.time_slots.map((slot) => ({
            id: slot.id,
            slot_id: slot.id,
            startTime: slot.start_time,
            endTime: slot.end_time,
          })),
          recurrence: details.weekly_recurrence ? "weekly" : details.monthly_recurrence ? "monthly" : "none",
          recurringDetails: {
            duration: details.weekly_recurrence || details.monthly_recurrence || 1,
          },
        }
      })

      setUnavailableDates(formattedData)
    } catch (error) {
      console.error("Error fetching unavailable dates:", error)
    }
  }
  useEffect(() => {
    fetchUnavailableDates()
  }, [venueId]) // runs whenever venueId changes


  const getAllRecurringTime = useMemo(() => {
    const allDates = {}

    Object.values(unavailableDates).forEach((dateData) => {
      const baseDate = startOfDay(new Date(dateData.date))

      // Always store base date with its timeslots
      allDates[baseDate.getTime()] = {
        ...dateData,
        date: baseDate,
        timeSlots: [...dateData.timeSlots], // clone to avoid mutation
      }

      if (dateData.recurrence !== "none" && dateData.recurringDetails?.duration) {
        const { duration } = dateData.recurringDetails

        for (let i = 1; i < duration; i++) {
          let nextDate
          if (dateData.recurrence === "weekly") {
            nextDate = startOfDay(addWeeks(baseDate, i))
          } else if (dateData.recurrence === "monthly") {
            nextDate = startOfDay(addMonths(baseDate, i))
          }

          if (nextDate) {
            allDates[nextDate.getTime()] = {
              ...dateData,
              date: nextDate,
              timeSlots: [...dateData.timeSlots], // ✅ copy timeslots to recurrence
            }
          }
        }
      }
    })

    return allDates
  }, [unavailableDates])

  const getUnavailableTimeSlots = (selectedDate) => {
    if (!unavailableDates || !selectedDate) return []

    const date = startOfDay(new Date(selectedDate))
    const key = format(date, "yyyy-MM-dd")

    // Check direct DB record first
    const directSlots = unavailableDates[key]?.timeSlots || []

    // If the date is not directly in DB, find if it's covered by a recurrence
    let recurrenceSlots = []

    if (!unavailableDates[key]) {
      Object.values(unavailableDates).forEach((base) => {
        if (base.recurrence !== "none" && base.recurringDetails?.duration) {
          const { duration } = base.recurringDetails
          const baseDate = startOfDay(new Date(base.date))

          for (let i = 1; i < duration; i++) {
            let nextDate
            if (base.recurrence === "weekly") {
              nextDate = startOfDay(addWeeks(baseDate, i))
            } else if (base.recurrence === "monthly") {
              nextDate = startOfDay(addMonths(baseDate, i))
            }

            if (nextDate?.getTime() === date.getTime()) {
              recurrenceSlots = [...base.timeSlots] // inherit parent slots
            }
          }
        }
      })
    } else {
      // If the date exists in DB and also was expanded into recurrence
      recurrenceSlots = getAllRecurringTime[key]?.timeSlots || []
    }

    // Merge both → directSlots take priority
    const merged = [...recurrenceSlots, ...directSlots]

    // Deduplicate
    const unique = merged.filter(
      (slot, index, arr) =>
        index === arr.findIndex((s) => s.startTime === slot.startTime && s.endTime === slot.endTime),
    )

    return unique
  }

  const generateTimeSlotId = () => Math.random().toString(36).substr(2, 9)
  const getOldSlotId = (oldDateKey, startTime, endTime) => {
    const oldDateEntry = unavailableDates[oldDateKey]
    if (!oldDateEntry) return null

    const matchingSlot = oldDateEntry.timeSlots.find((slot) => slot.startTime === startTime && slot.endTime === endTime)

    return matchingSlot ? matchingSlot.id : null
  }


  const formatDateForLocale = (dateKey) => {
    // dateKey is a string or Date-compatible value
    try {
      const d = new Date(dateKey)
      return i18n?.language === 'am' ? formatEthiopian(d, { amharic: true }) : format(d, "MMM d, yyyy")
    } catch (e) {
      return dateKey
    }
  }

  const formatDateTimeSlots = (dateObj) => {
    if (!dateObj || Object.keys(dateObj).length === 0) return "No dates"

    const entries = Object.entries(dateObj)
    const displayEntries = entries

    const formatted = displayEntries.map(([dateKey, data]) => {
      const formattedDate = formatDateForLocale(dateKey)
      if (data.fullDay || !data.timeSlots || data.timeSlots.length === 0) {
        return (
          <div key={dateKey} className="mb-1">
            <span className="font-medium text-gray-900">{formattedDate}</span>
            {data.area_sqm ? (
              <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                {data.area_sqm} m²
              </span>
            ) : (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {data.isHalfDay ? t('services.half_day') : t('services.full_day')}
              </span>
            )}
          </div>
        )
      }
      const timeSlots = data.timeSlots
        .map((slot) => `${convertTo12Hour(slot.startTime)} - ${convertTo12Hour(slot.endTime)}`)
        .join(", ")
      return (
        <div key={dateKey} className="mb-1">
          <div className="font-medium text-gray-900">{formattedDate}</div>
          <div className="text-sm text-gray-600 ml-2">{timeSlots}</div>
        </div>
      )
    })

    return (
      <div>
        {formatted}

      </div>
    )
  }
  const formatDateTimeSlotsState = (dateObj) => {
    if (!dateObj || Object.keys(dateObj).length === 0) return "No dates"

    const entries = Object.entries(dateObj)
    const displayEntries = entries

    const formatted = displayEntries.map(([dateKey, data]) => {
      const formattedDate = formatDateForLocale(dateKey)
      if (data.fullDay || !data.timeSlots || data.timeSlots.length === 0) {
        return (
          <div key={dateKey} className="mb-1">
            <span className="font-medium text-gray-900">{formattedDate}</span>
            {data.area_sqm ? (
              <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                {data.area_sqm} m²
              </span>
            ) : (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {data.isHalfDay ? t('services.half_day') : t('services.full_day')}
              </span>
            )}
          </div>
        )
      }
      let timeSlots;
      // If editing, check if this date is in the original editingRequest
      if (editingRequest) {
        const editingDates = editingRequest.date || {};
        const isEditingDate = Object.keys(editingDates).some(
          (key) => {
            const editDateObj = editingDates[key];
            return format(new Date(editDateObj.date), "yyyy-MM-dd") === dateKey;
          }
        );
        if (isEditingDate) {
          // Show all slots for this date (including those from DB)
          timeSlots = data.timeSlots
            .map((slot) => `${convertTo12Hour(slot.startTime)} - ${convertTo12Hour(slot.endTime)}`)
            .join(", ");
        } else if (unavailableDates[dateKey]) {
          // New unavailable date added during edit: show only new slots (no slot_id)
          timeSlots = data.timeSlots
            .filter(slot => !slot.slot_id)
            .map((slot) => `${convertTo12Hour(slot.startTime)} - ${convertTo12Hour(slot.endTime)}`)
            .join(", ");
        } else {
          // New available date: show all slots
          timeSlots = data.timeSlots
            .map((slot) => `${convertTo12Hour(slot.startTime)} - ${convertTo12Hour(slot.endTime)}`)
            .join(", ");
        }
      } else if (unavailableDates[dateKey]) {
        // Not editing: show only new slots for unavailable dates
        timeSlots = data.timeSlots
          .filter(slot => !slot.slot_id)
          .map((slot) => `${convertTo12Hour(slot.startTime)} - ${convertTo12Hour(slot.endTime)}`)
          .join(", ");
      } else {
        // Not editing, available date: show all slots
        timeSlots = data.timeSlots
          .map((slot) => `${convertTo12Hour(slot.startTime)} - ${convertTo12Hour(slot.endTime)}`)
          .join(", ");
      }
      return (
        <div key={dateKey} className="mb-1">
          <div className="font-medium text-gray-900">{formattedDate}</div>
          <div className="text-sm text-gray-600 ml-2">{timeSlots}</div>
        </div>
      );
    });

    return (
      <div>
        {formatted}

      </div>
    )
  }

  const saveDraft = async () => {


    try {

      // Convert scheduleDates to the format expected by controller
      const dateArray = Object.entries(scheduleDates).map(([dateKey, dateData]) => ({
        date: dateKey,
        full_day: true,
        is_half_day: dateData.isHalfDay,
        area_sqm: dateData.area_sqm || null,
        time_slots:
          dateData.fullDay && dateData.timeSlots.length != 0
            ? []
            : dateData.timeSlots.map((slot) => ({
              id: slot.slot_id || null,
              start_time: slot.startTime,
              end_time: slot.endTime,
            })),
      }))

      if (editingRequest) {
        // Date to delete
        if (toBeDeleted.length !== 0) {
          for (let i = 0; i < toBeDeleted.length; i++) {
            try {
              await axios.delete(`/user/service-request/request-dates/${toBeDeleted[i]}`)
            } catch (err) {
              toast.error("error deleting date")
            }
          }
        }

        // Slot to delete
        if (slotDelete.length !== 0) {
          for (let i = 0; i < slotDelete.length; i++) {
            try {
              await axios.delete(`/user/service-request/time-slot/${slotDelete[i]}`)
            } catch (err) {
              toast.error("error deleting time slots")
            }
          }
        }

        setRequests(
          requests.map((req) =>
            req.id === editingRequest.id
              ? {
                ...req,
                ...formData,
                date: scheduleDates,
              }
              : req,
          ),
        )

        const newReq = {
          org_name: formData.organizationName,
          contact_person: formData.contactPerson,
          email: formData.email,
          phone_no: formData.phoneNo,
          exp_attendees: formData.expectedAttendees,
          date: dateArray,
        }
        const formDataToSend = new FormData()
        formDataToSend.append("org_name", formData.organizationName)
        formDataToSend.append("contact_person", formData.contactPerson)
        formDataToSend.append("phone_no", formData.phoneNo)
        formDataToSend.append("exp_attendees", formData.expectedAttendees)
        formDataToSend.append("file", formData.file)
        // File only if user uploaded one
        if (formData.attachment) {
          formDataToSend.append("attachment", formData.attachment)
        }

        // Dates need to be stringified
        formDataToSend.append("date", JSON.stringify(dateArray))

        try {
          const req = await axios.put(`/user/service-request/${editingRequest.id}`, formDataToSend,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          )
        } catch (error) {
          if (error.response?.status === 400 && error.response.data?.errors) {
            handleUpErrors(error.response.data.errors)
          } else {
            console.error("Unexpected error:", error)
          }
          return
        }
        setToBeDeleted([])
        setSlotDelete([])
        toast.success("Request updated successfully")
        setUpErrors({})
        setEditingRequest(null)
      } else {
        formData.venue = selectedFacility.name
        formData.category = selectedFacility.category
        const newRequest = {
          ...formData,
          date: scheduleDates,
          status: "draft",
          createdAt: new Date().toISOString().split("T")[0],
          paid: false,
        }
        setRequests([...requests, newRequest])

        const newReq = {
          ...formData,
          date: dateArray,
          status: "draft",
          paid: false,
        }
        const formDataToSend = new FormData()
        formDataToSend.append("organizationName", formData.organizationName)
        formDataToSend.append("contactPerson", formData.contactPerson)
        formDataToSend.append("email", formData.email)
        formDataToSend.append("phoneNo", formData.phoneNo)
        formDataToSend.append("expectedAttendees", formData.expectedAttendees)
        formDataToSend.append("venue", selectedFacility.name)
        formDataToSend.append("category", selectedFacility.category)


        // File only if user uploaded one
        if (formData.attachment) {
          formDataToSend.append("attachment", formData.attachment)
        }

        // Dates need to be stringified
        formDataToSend.append("date", JSON.stringify(dateArray))
        if (selectedFacility?.category?.toLowerCase() === 'plaza' || editingRequest?.category?.toLowerCase() === 'plaza') {
          formDataToSend.append("area_sqm", formData.area_sqm)
        }
        try {
          await axios.post("/user/service-request", formDataToSend,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          )
        } catch (error) {
          if (error.response?.status === 400 && error.response.data?.errors) {
            handleFieldErrors(error.response.data.errors)
          } else {
            console.error("Unexpected error:", error)
          }
          return
        }
        toast.success("Request created successfully")
        setFieldErrors({})
      }
      setToBeDeleted([])
      setSlotDelete([])

      scrollToBookingCard()

      // Simulate booking submission
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setIsSubmitted(true)

      // Reset form after 3 seconds
      setTimeout(() => {
        resetForm()
      }, 10000)

      // Unlock back navigation after saving/updating draft
      setLockBack(false)

    } catch (error) {
      console.error("Booking submission failed:", error)
    }
  }
  const handleSubmitDraft = async (id) => {
    try {
      // 1. Find the draft request by id
      const draft = requests.find((r) => r.id === id);
      if (!draft) {
        toast.error("Draft not found");
        return;
      }

      // 2. Fetch latest unavailable dates for the draft's venue
      const venueId = draft.venue_id;
      if (!venueId) {
        toast.error("Venue not found for this draft");
        return;
      }
      //  Format date keys to "yyyy-MM-dd"
      const darftDate = {}
      Object.keys(draft.date || {}).forEach((key) => {
        const dateObj = draft.date[key]
        const newKey = format(new Date(dateObj.date), "yyyy-MM-dd") // format the actual date inside object
        darftDate[newKey] = { ...dateObj } // keep the rest as is
      })


      // Always fetch latest unavailable dates to avoid race conditions
      const response = await axios.get(`/user/schedule/${venueId}`);
      //const latestUnavailable = response.data || {};
      const formattedData = {}
      Object.entries(response.data).forEach(([date, details]) => {
        formattedData[date] = {
          id: details.id,
          date: new Date(date),
          fullDay: details.time_slots.length === 0,
          timeSlots: details.time_slots.map((slot) => ({
            id: slot.id,
            slot_id: slot.id,
            startTime: slot.start_time,
            endTime: slot.end_time,
          })),
          recurrence: details.weekly_recurrence ? "weekly" : details.monthly_recurrence ? "monthly" : "none",
          recurringDetails: {
            duration: details.weekly_recurrence || details.monthly_recurrence || 1,
          },
        }
      })
      // 3. Check for date and time slot conflicts
      const conflicts = [];
      Object.entries(darftDate || {}).forEach(([dateKey, dateObj]) => {
        const unavailable = formattedData[dateKey];
        if (unavailable) {
          // If full day is unavailable, any request for that date is a conflict
          if (!unavailable.timeSlots || unavailable.timeSlots.length === 0) {
            conflicts.push({ date: dateKey, type: "full" });
          } else if (dateObj.timeSlots && dateObj.timeSlots.length > 0) {
            // Check for overlapping time slots
            dateObj.timeSlots.forEach((slot) => {
              const overlap = unavailable.timeSlots.some(
                (u) =>
                  (slot.startTime < u.endTime && slot.endTime > u.startTime) // overlap logic
              );
              if (overlap) {
                conflicts.push({ date: dateKey, type: "slot", slot });
              }
            });
          }
        }
      });

      if (conflicts.length > 0) {
        // Build a readable message
        const msg = conflicts
          .map((c) =>
            c.type === "full"
              ? `Date: ${c.date} (fully unavailable)`
              : `Date: ${c.date}, Time: ${c.slot.startTime} - ${c.slot.endTime} (overlaps)`
          )
          .join("\n");
        toast.error(
          `Some of your selected dates/times are no longer available:\n${msg}`
        );
        return;
      }

      // 4. If no conflicts, submit the draft
      await axios.put(`/user/service-request/${id}`, {
        status: "pending",
      });
      toast.success("Request submitted successfully");
      fetchRequests();
      resetForm();
    } catch (err) {
      console.error("Failed to submit draft", err);
      toast.error("Could not submit draft");
    }
  };

  const handleCancelRequest = async (booking) => {

    // 2. Fetch latest unavailable dates 
    const venueId = booking.venue_id;
    if (!venueId) {
      toast.error("Venue not found for this draft");
      return;
    }

    // Always fetch latest unavailable dates to avoid race conditions
    const response = await axios.get(`/user/schedule/${venueId}`);
    //const latestUnavailable = response.data || {};
    const updatedUnavailableDates = {}
    Object.entries(response.data).forEach(([date, details]) => {
      updatedUnavailableDates[date] = {
        id: details.id,
        date: new Date(date),
        fullDay: details.time_slots.length === 0,
        timeSlots: details.time_slots.map((slot) => ({
          id: slot.id,
          slot_id: slot.id,
          startTime: slot.start_time,
          endTime: slot.end_time,
        })),
        recurrence: details.weekly_recurrence ? "weekly" : details.monthly_recurrence ? "monthly" : "none",
        recurringDetails: {
          duration: details.weekly_recurrence || details.monthly_recurrence || 1,
        },
      }
    })


    // Build formatted dates for comparison
    const formattedOldDates = {}
    Object.keys(booking.date || {}).forEach((key) => {
      const dateObj = booking.date[key]
      const newKey = format(new Date(dateObj.date), "yyyy-MM-dd")
      formattedOldDates[newKey] = { ...dateObj }
    })

    // Delete old unavailable dates if they exist in DB
    for (const [dateKey, dateObj] of Object.entries(formattedOldDates)) {
      const existingDate = updatedUnavailableDates[dateKey]
      if (!existingDate) continue
      const currentSlots = Array.isArray(dateObj.timeSlots) ? dateObj.timeSlots : []
      const existingSlots = Array.isArray(existingDate.timeSlots) ? existingDate.timeSlots : []

      if (currentSlots.length === 0 || currentSlots.length === existingSlots.length) {
        await axios.delete(`/user/schedule/${existingDate.id}`)
        delete updatedUnavailableDates[dateKey]
      } else {
        for (const slot of currentSlots) {
          const slotId = getOldSlotId(dateKey, slot.startTime, slot.endTime)
          if (!slotId) continue
          await axios.delete(`/user/schedule/time-slot/${slotId}`)
          updatedUnavailableDates[dateKey].timeSlots = updatedUnavailableDates[dateKey].timeSlots.filter(
            (s) => s.id !== slotId,
          )
        }
      }
    }

    setUnavailableDates(updatedUnavailableDates)
    try {
      await axios.delete(`/user/service-request/${booking.id}`);
      toast.success("Request deleted successfully")
      fetchRequests()

    } catch (err) {
      console.error("Failed to submit draft", err);
      toast.error("Could not delete draft");
    }
  };


  const handleEditRequest = (request) => {
    setUpErrors({})
    setFieldErrors({})
    // set venue id from request if available, otherwise try selectedFacility
    if (request.venue_id) setVenueId(request.venue_id)
    else if (selectedFacility && selectedFacility.venue_id) setVenueId(selectedFacility.venue_id)
    //fetchUnavailableDates()

    setEditingRequest(request)
    setFormData({
      organizationName: request.organizationName,
      contactPerson: request.contactPerson,
      email: request.email,
      phoneNo: request.phoneNo,
      expectedAttendees: request.expectedAttendees,
      attachment: null,
      file: request.file,
      area_sqm: request.area_sqm || ""
    })

    //  Format date keys to "yyyy-MM-dd"
    const formattedScheduleDates = {}
    Object.keys(request.date || {}).forEach((key) => {
      const dateObj = request.date[key]
      const newKey = format(new Date(dateObj.date), "yyyy-MM-dd") // format the actual date inside object
      formattedScheduleDates[newKey] = {
        ...dateObj,
        area_sqm: dateObj.area_sqm || request.area_sqm || ""
      } // keep the rest as is, ensure area_sqm exists
    })

    //  Update state with formatted keys
    setScheduleDates(formattedScheduleDates)
    setSelectedDates(Object.keys(request.date || {}).map((dateKey) => new Date(dateKey)))
    // Switch to Book Service tab and jump to step 3 (select dates)
    setTabValue("book-service")
    setCurrentStep(3)
    // Lock backward navigation while editing a draft so user cannot change service/facility
    setLockBack(true)
    scrollToBookingCard()
  }

  const handleDateSelect = (dates) => {
    if (!dates) return
    // Toggle logic: if a date is already selected, remove it; else add it
    // Find which dates were removed and which were added
    const prevDates = selectedDates.map((d) => format(new Date(d), "yyyy-MM-dd"))
    const newDates = dates.map((d) => format(new Date(d), "yyyy-MM-dd"))

    // Dates to remove: in prevDates but not in newDates
    const removed = prevDates.filter((d) => !newDates.includes(d))
    // Dates to add: in newDates but not in prevDates
    const added = newDates.filter((d) => !prevDates.includes(d))

    // Remove from scheduleDates and add to setToBeDeleted if it has an id
    if (removed.length > 0) {
      setScheduleDates((prev) => {
        const updated = { ...prev }
        removed.forEach((dateKey) => {
          if (prev[dateKey] && prev[dateKey].id) {
            setToBeDeleted((prevDel) => [...prevDel, prev[dateKey].id])
          }
          delete updated[dateKey]
        })
        return updated
      })
    }

    // Add new dates to scheduleDates if they don't exist
    added.forEach((dateKey) => {
      if (!scheduleDates[dateKey]) {
        setScheduleDates((prev) => ({
          ...prev,
          [dateKey]: unavailableDates[dateKey]
            ? { ...unavailableDates[dateKey] }
            : {
              date: new Date(dateKey),
              fullDay: true,
              isHalfDay: false,
              timeSlots: [],
              area_sqm: formData.area_sqm || "",
            },
        }))
      }
    })

    // Update selectedDates
    setSelectedDates(dates)
  }

  const updateDateSettings = (dateKey, updates) => {
    setScheduleDates((prev) => ({
      ...prev,
      [dateKey]: { ...prev[dateKey], ...updates },
    }))
  }

  const addTimeSlot = (dateKey) => {
    const newSlot = {
      id: generateTimeSlotId(),
      startTime: "00:00",
      endTime: "00:00",
    }

    setScheduleDates((prev) => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        timeSlots: [...prev[dateKey].timeSlots, newSlot],
      },
    }))
  }

  const removeTimeSlot = (dateKey, slotId, dbSlotId) => {
    if (dbSlotId) {
      setSlotDelete((prev) => [...prev, dbSlotId])
    }

    setScheduleDates((prev) => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        timeSlots: prev[dateKey].timeSlots.filter((slot) => slot.id !== slotId),
      },
    }))
  }

  const updateTimeSlot = (dateKey, slotId, field, value) => {
    setScheduleDates((prev) => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        timeSlots: prev[dateKey].timeSlots.map((slot) => (slot.id === slotId ? { ...slot, [field]: value } : slot)),
      },
    }))
  }

  const removeDateBlock = async (dateKey) => {
    setSelectedDates((prev) => prev.filter((date) => format(new Date(date), "yyyy-MM-dd") !== dateKey))

    if (scheduleDates[dateKey].id) {
      setToBeDeleted((prev) => [...prev, scheduleDates[dateKey].id])
    }

    setScheduleDates((prev) => {
      const newDates = { ...prev }
      delete newDates[dateKey]
      return newDates
    })
  }
  const clearAllDates = () => {
    if (editingRequest) {
      const dateIdsToDelete = Object.values(editingRequest.date)
        .filter((dateObj) => dateObj.id) // Only dates that have an ID
        .map((dateObj) => dateObj.id) // Extract the IDs

      setToBeDeleted(dateIdsToDelete)
    }
    setSelectedDates([])
    setScheduleDates({})
  }


  useEffect(() => {
    setIsVisible(true)
  }, [])

  // OTP countdown timer
  useEffect(() => {
    let interval
    if (paymentData.otpCountdown > 0) {
      interval = setInterval(() => {
        setPaymentData((prev) => ({ ...prev, otpCountdown: prev.otpCountdown - 1 }))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [paymentData.otpCountdown])

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
    scrollToBookingCard()
  }
  const handleNextStep3 = () => {
    if (currentStep < totalSteps) {
      formData.email = user.email
      for (const date of selectedDates) {
        const dateKey = format(new Date(date), "yyyy-MM-dd")
        const dateData = scheduleDates[dateKey]
        if (!dateData) continue

        if (selectedFacility?.category?.toLowerCase() === 'plaza' || editingRequest?.category?.toLowerCase() === 'plaza') {
          if (!dateData.area_sqm || Number(dateData.area_sqm) <= 0) {
            toast.error("Enter area > 0")
            return
          }
        }
        // If not full day, check each time slot
        if (!dateData.fullDay) {
          // Check for invalid ranges
          for (const slot of dateData.timeSlots) {
            if (toMinutes(slot.startTime) >= toMinutes(slot.endTime)) {
              toast.error(
                `Invalid time slot for ${format(date, "MMMM d, yyyy")}: ${convertTo12Hour(slot.startTime)} - ${convertTo12Hour(slot.endTime)}  is not a valid range.`,
              )
              return;
            }
          }
          // Check for overlapping slots
          const slots = dateData.timeSlots;
          for (let i = 0; i < slots.length; i++) {
            const slotA = slots[i];
            const startA = toMinutes(slotA.startTime);
            const endA = toMinutes(slotA.endTime);
            for (let j = 0; j < slots.length; j++) {
              if (i === j) continue; // Don't compare slot with itself
              const slotB = slots[j];
              const startB = toMinutes(slotB.startTime);
              const endB = toMinutes(slotB.endTime);
              // Overlap if startA < endB && endA > startB
              if (startA < endB && endA > startB) {
                toast.error(
                  `Time slots overlap for ${format(date, "MMMM d, yyyy")}: ${convertTo12Hour(slotA.startTime)} - ${convertTo12Hour(slotA.endTime)} and ${convertTo12Hour(slotB.startTime)} - ${convertTo12Hour(slotB.endTime)}.`,
                );
                return;
              }
            }
          }
        }

        // If the date is in unavailableDates, require at least one new time slot
        if (unavailableDates[dateKey]) {
          if (editingRequest) {
            // Check if this date is already in editingRequest
            const editingDates = editingRequest.date || {};
            const isEditingDate = Object.keys(editingDates).some(
              (key) => {
                const editDateObj = editingDates[key];
                // Compare by formatted date string
                return format(new Date(editDateObj.date), "yyyy-MM-dd") === dateKey;
              }
            );
            if (isEditingDate) {
              // If editing an existing date, require at least one time slot
              if (!dateData.timeSlots || dateData.timeSlots.length === 0) {
                toast.error(
                  `Please add at least one time slot for ${format(date, "MMMM d, yyyy")} (unavailable date).`,
                );
                return;
              }
            } else {
              // New date added during edit, same logic as new booking
              if (!dateData.timeSlots || dateData.timeSlots.length <= unavailableDates[dateKey].timeSlots.length) {
                toast.error(
                  `Please add at least one new time slot for ${format(date, "MMMM d, yyyy")} (unavailable date).`,
                );
                return;
              }
            }
          } else {
            // Not editing, normal new booking logic
            if (!dateData.timeSlots || dateData.timeSlots.length <= unavailableDates[dateKey].timeSlots.length) {
              toast.error(
                `Please add at least one new time slot for ${format(date, "MMMM d, yyyy")} (unavailable date).`,
              );
              return;
            }
          }
        }
      }
      setCurrentStep(currentStep + 1)
    }
    scrollToBookingCard()
  }


  const isSlotNotInUnavailable = (dateKey, slot) => {
    const unavailableSlots = unavailableDates[dateKey]?.timeSlots || [];
    // Check if any slot matches startTime and endTime
    const exists = unavailableSlots.some(
      (unSlot) =>
        unSlot.startTime === slot.startTime && unSlot.endTime === slot.endTime
    );
    return !exists; // true if NOT in unavailableDates
  };

  const handlePrevStep = () => {
    if (editingRequest) {
      // Only block prev at step 3 when editing
      if (currentStep === 3) {
        toast.info("You cannot go back to previous steps while editing a draft. Only step 3 and 4 are editable.");
        return;
      }
      // Allow prev at steps 4 and 5
      if (currentStep > 3) {
        setCurrentStep(currentStep - 1);
      }
      return;
    }
    if (lockBack) return; // legacy lockBack for non-editing
    if (currentStep === 3) {
      setSelectedDates([])
      setScheduleDates({})
    }
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
    scrollToBookingCard()
  }

  const handleServiceSelect = (serviceId) => {
    setSelectedService(serviceId)
    setSelectedFacility(null)
  }

  const handleFacilitySelect = (facility) => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }

    setSelectedFacility(facility)
    setVenueId(facility.venue_id)
  }



  const resetForm = () => {
    setIsSubmitted(false)
    setCurrentStep(1)
    setSelectedService("")
    setSelectedFacility(null)
    setFormData({
      organizationName: "",
      contactPerson: "",
      email: "",
      phoneNo: "",
      expectedAttendees: "",
      venue: "",
      category: "",
      attachment: null
    })
    setSelectedDates([])
    setScheduleDates({})
  }

  const openPaymentModal = async (booking) => {
    setPaymentData((prev) => ({
      ...prev,
      isProcessing: true,
    }));
    let res;
    try {
      res = await axios.post(`/service-request/validate/${booking.id}`);
      window.location.href = res.data.checkout_url;
    } catch (err) {
      toast.error(err.response?.data?.error)
      setPaymentData((prev) => ({
        ...prev,
        isProcessing: false,
      }));
    }
    setPaymentModal({ isOpen: true, booking });
    // Keep isProcessing true until redirect or error
    setPaymentData((prev) => ({
      ...prev,
      paymentMethod: "",
      phoneNumber: "",
      otp: "",
      isSuccess: false,
      otpSent: false,
      otpCountdown: 0,
    }));
  }

  const getStatusIcon = (booking) => {
    let status = booking.status
    if ((booking.status === "approved") && (booking.paid)) {
      status = "paid"
    }
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "pending":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case "paid":
        return <CreditCard className="w-4 h-4 text-amber-500" />
      case "draft":
        return <AlertCircle className="w-4 h-4  text-blue-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (booking) => {
    let status = booking.status
    if ((booking.status === "approved") && (booking.paid)) {
      status = "paid"
    }
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "paid":
        return "bg-green-300 text-blue-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "draft":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }


  // --- HERO HELPERS (move above component for correct parsing) ---
  function getHeroFacilities(facilities) {
    if (!facilities || facilities.length === 0) return [];
    const sorted = [...facilities].sort((a, b) => {
      if (a.updated_at && b.updated_at) {
        return new Date(b.updated_at) - new Date(a.updated_at);
      }
      return b.id - a.id;
    });
    return sorted.slice(0, 3);
  }

  function HeroFacilitiesCarousel({ facilities }) {
    const heroFacilities = getHeroFacilities(facilities)

    if (heroFacilities.length === 0) {
      return (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-amber-700 to-amber-900 opacity-70 z-0" />
      )
    }

    return (
      <div className="absolute inset-0 w-full h-full z-0">
        {heroFacilities.map((facility, index) => (
          <div
            key={facility.id}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${index === currentHeroSlide ? 'opacity-70' : 'opacity-0'
              }`}
          >
            {facility.videos ? (
              <video
                src={facility.video}
                autoPlay
                loop
                muted
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <img
                src={facility.image || "/placeholder.svg"}
                alt={facility.name}
                className="w-full h-full object-cover object-center"
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  const [comparisonFacilities, setComparisonFacilities] = useState([null, null])

  // Get all facilities for comparison
  const allFacilities = useMemo(() => {
    return serviceCategories.flatMap((category) =>
      category.facilities.map((facility) => ({
        ...facility,
        category: category.name,
      })),
    )
  }, [serviceCategories])

  // Handle facility selection for comparison
  const handleComparisonSelect = (facilityId, index) => {
    const facility = allFacilities.find((f) => f.id === facilityId)
    const newComparison = [...comparisonFacilities]
    newComparison[index] = facility
    setComparisonFacilities(newComparison)
  }

  // Remove facility from comparison
  const removeFromComparison = (index) => {
    const newComparison = [...comparisonFacilities]
    newComparison[index] = null
    setComparisonFacilities(newComparison)
  }

  // Clear all comparisons
  const clearComparison = () => {
    setComparisonFacilities([null, null])
  }
  const filteredFacilities = useMemo(() => {
    if (selectedCategoryFilter === "all") {
      return allFacilities
    }
    return allFacilities.filter((facility) => facility.category === selectedCategoryFilter)
  }, [allFacilities, selectedCategoryFilter])

  // --- HERO HELPERS (move above component for correct parsing) ---
  function getHeroFacilities(facilities) {
    if (!facilities || facilities.length === 0) return []
    const sorted = [...facilities].sort((a, b) => {
      // Sort by capacity (highest first)
      return (b.capacity || 0) - (a.capacity || 0)
    })
    return sorted.slice(0, 3)
  }

  function getHeroDescription(facilities) {
    const heroFacilities = getHeroFacilities(facilities)
    return heroFacilities[0] && heroFacilities[0].description
      ? heroFacilities[0].description
      : "Discover our premium venues and services for every occasion."
  }

  const [currentHeroSlide, setCurrentHeroSlide] = useState(0)
  const heroFacilities = getHeroFacilities(allFacilities)

  useEffect(() => {
    if (heroFacilities.length > 1) {
      const interval = setInterval(() => {
        setCurrentHeroSlide((prev) => (prev + 1) % heroFacilities.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [heroFacilities.length])

  const steps = useMemo(
    () => [
      { id: 1, title: t("services.step_service"), icon: Building, description: t("services.step_service_desc") },
      { id: 2, title: t("services.step_facility"), icon: Crown, description: t("services.step_facility_desc") },
      { id: 3, title: t("services.step_schedule"), icon: CalendarDays, description: t("services.step_schedule_desc") },
      { id: 4, title: t("services.step_details"), icon: Users, description: t("services.step_details_desc") },
      { id: 5, title: t("services.step_review"), icon: CheckCircle, description: t("services.step_review_desc") },
    ],
    [i18n.language] // recompute only when language changes
  );

  function Stepper({ currentStep }) {
    return (
      <div className="flex justify-between items-center mb-4 sm:mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.id}
              initial={false} // prevents resetting to "initial" on re-render
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center text-center w-full relative"
            >
              <div
                className={`rounded-full p-2 sm:p-3 border-2 ${currentStep >= step.id
                  ? "bg-amber-500 border-amber-500 text-black"
                  : "bg-gray-200 border-gray-300"
                  }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <p className="text-xs sm:text-sm font-medium mt-1 sm:mt-2 px-1">{step.title}</p>
              <p className="hidden xs:block text-xs sm:text-xs text-gray-500 px-1">
                {step.description}
              </p>
              {index < steps.length - 1 && (
                <div className="absolute top-4 sm:top-5 left-1/2 w-full h-0.5 bg-gray-200 -z-10">
                  <div
                    className="h-0.5 bg-amber-500 transition-all duration-500"
                    style={{ width: currentStep > step.id ? "100%" : "0%" }}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  }
  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen">
      <Navigation />

      {/* Auth Required Dialog */}
      {showAuthDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
            <h2 className="text-xl font-semibold mb-4">{t('services.sign_in')}</h2>
            <p className="mb-6">{t('services.sign_in_desc')}</p>
            <a
              href="/signin"
              className="inline-block bg-amber-500 hover:bg-amber-600 text-black px-6 py-2 rounded font-medium mb-2"
            >
              {t('services.go_to_signin')}
            </a>
            <button
              onClick={() => setShowAuthDialog(false)}
              className="block w-full mt-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              {t('services.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Hero Section: Fullscreen, last 3 updated facilities */}
      <section
        className="relative w-full min-h-screen flex flex-col justify-center items-center bg-black text-white overflow-hidden"
        style={{ minHeight: "100vh" }}
      >
        <HeroFacilitiesCarousel facilities={allFacilities} />
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full py-16 px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold font-serif mb-6 drop-shadow-lg">
            {t('services.hero')}
          </h1>

          {heroFacilities.length > 0 && (
            <div className="max-w-4xl mx-auto mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold capitalize mb-4 drop-shadow">
                {translateField(heroFacilities[currentHeroSlide], i18n.language, "name")}
              </h2>


              <div className="flex flex-wrap justify-center gap-4 mb-6">
                {heroFacilities[currentHeroSlide]?.features?.slice(0, 2).map((feature, idx) => (
                  <div key={idx} className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <span className="text-white font-medium">
                      {i18n.language === 'am' && heroFacilities[currentHeroSlide].features_am
                        ? heroFacilities[currentHeroSlide].features_am[idx]
                        : feature}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center items-center gap-8 text-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{heroFacilities[currentHeroSlide]?.capacity} {t('services.capacity')}</span>
                </div>

              </div>
            </div>
          )}

          {heroFacilities.length > 1 && (
            <div className="flex justify-center gap-2 mb-8">
              {heroFacilities.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentHeroSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentHeroSlide ? 'bg-white' : 'bg-white/50'
                    }`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="absolute bottom-8 left-0 w-full flex justify-center z-20">
          <a
            href="#book-service"
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-full shadow-lg text-lg transition-all duration-200"
          >
            {t('services.hero_btn')}
          </a>
        </div>
      </section>

      {/* Services Overview Section */}
      <section className="md:py-16 py-10 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-eb-garamond text-4xl lg:text-5xl text-amber-400 mb-4">{t('services.main_title')}</h2>
            <div className="w-24 h-px bg-amber-400 mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              {t('services.main_desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            {serviceCategories.map((category, index) => {
              const IconComponent = category.icon
              const isEven = index % 2 === 0
              return (
                <div
                  key={category.id}
                  className={`flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-8 animate-fade-in-up`}
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-4 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-xl border border-amber-500/30">
                        <IconComponent className="w-8 h-8 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{translateField(category, i18n.language, "name")}</h3>
                        <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full mt-2"></div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-amber-400 mb-3">{t('services.available_facilities')}</h4>
                      {category.facilities.map((facility) => (
                        <div key={facility.id} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{translateField(facility, i18n.language, "name")}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {facility.capacity} {t('services.capacity')}
                              </span>
                              {facility.category?.toLowerCase() === 'plaza' ? (
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {facility.price_per_sqm} {facility.currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")} / m²
                                </span>
                              ) : (
                                facility.price_full_day > 0 && (
                                  <span className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {facility.price_full_day} {facility.currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")} ({t('services.full_day')})
                                  </span>
                                )
                              )}

                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4">
                      <Button
                        className="bg-transparent border-2 border-amber-400 text-amber-400 hover:bg-amber-400/10 hover:border-amber-500 font-light px-6 py-2 tracking-wider transform hover:scale-105 transition-all duration-300"
                        onClick={() => document.querySelector('[value="book-service"]')?.click()}
                      >
                        <a href="#book-service">
                          {t('services.book_now')}
                        </a>
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <div className="relative h-64 w-full rounded-2xl overflow-hidden shadow-2xl">
                      <img
                        src={category.facilities[0]?.image || "/placeholder.svg"}
                        alt={category.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        className="object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3">
                          <p className="text-sm font-medium text-white">
                            {category.facilities.length}{" "}{t('services.facilities_available')}
                          </p>
                          <p className="text-xs text-white/80 mt-1">
                            {t('services.starting_from')}{" "}
                            {category.name?.toLowerCase() === 'plaza' ? (
                              <>{Math.min(...category.facilities.map((f) => f.price_per_sqm).filter((rate) => rate > 0))}{" "}
                                {category.facilities[0].currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")} / m²</>
                            ) : (
                              <>{Math.min(...category.facilities.map((f) => f.price_full_day).filter((rate) => rate > 0))}{" "}
                                {category.facilities[0].currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")} ({t('services.full_day')})</>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Decorative elements */}
                    <div
                      className={`absolute -top-4 ${isEven ? "-right-4" : "-left-4"} w-24 h-24 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-full opacity-20 -z-10`}
                    ></div>
                    <div
                      className={`absolute -bottom-4 ${isEven ? "-left-4" : "-right-4"} w-16 h-16 bg-gradient-to-br from-amber-600/20 to-amber-400/20 rounded-full opacity-30 -z-10`}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Facilities Showcase & Comparison Section */}
          <section className="py-5 bg-gradient-to-br from-amber-50 via-white to-amber-50">
            <div className="container mx-auto md:px-8 px-0">
              {/* Section Header */}
              <div className="text-center mb-16">
                <h2 className="font-eb-garamond text-4xl lg:text-5xl text-gray-900 mb-4">{t('services.features_grid_title')}</h2>
                <div className="w-24 h-px bg-amber-400 mx-auto mb-6"></div>
                <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                  {t('services.features_grid_desc')}
                </p>
              </div>
              {/* Facilities Grid - Convincing Presentation */}
              <div className="p-0 w-full">
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('services.browse')}</h3>
                      <p className="text-gray-600">{t('services.browse_desc')}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {t('services.showing')} {filteredFacilities.length} {t('services.of')} {allFacilities.length} {t('services.facili')}
                    </div>
                  </div>

                  {/* Mobile Dropdown (below md breakpoint) */}
                  <div className="block md:hidden mb-6">
                    <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                      <SelectTrigger className="w-full bg-white border-gray-300 hover:border-amber-300 focus:border-amber-500">
                        <div className="flex items-center gap-2">
                          {selectedCategoryFilter === "all" ? (
                            <>
                              <Building className="w-4 h-4" />
                              <span>{t('services.all_categories')} ({allFacilities.length})</span>
                            </>
                          ) : (
                            <>
                              {(() => {
                                const category = serviceCategories.find(cat => cat.name === selectedCategoryFilter)
                                const IconComponent = category?.icon || Building
                                return (
                                  <>
                                    <IconComponent className="w-4 h-4" />
                                    <span>{category?.name} ({category?.facilities.length || 0})</span>
                                  </>
                                )
                              })()}
                            </>
                          )}
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        <SelectItem value="all" className="hover:bg-amber-50 focus:bg-amber-50">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            <span>{t('services.all_categories')}</span>
                            <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-800">
                              {allFacilities.length}
                            </Badge>
                          </div>
                        </SelectItem>
                        {serviceCategories.map((category) => {
                          const IconComponent = category.icon
                          return (
                            <SelectItem key={category.id} value={category.name} className="hover:bg-amber-50 focus:bg-amber-50">
                              <div className="flex items-center gap-2">
                                <IconComponent className="w-4 h-4" />
                                <span>{translateField(category, i18n.language, "name")}</span>
                                <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-800">
                                  {category.facilities.length}
                                </Badge>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Desktop/Tablet Buttons (md breakpoint and above) */}
                  <div className="hidden md:flex flex-wrap gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedCategoryFilter("all")}
                      className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${selectedCategoryFilter === "all"
                        ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-lg"
                        : "bg-white text-gray-700 border border-gray-300 hover:border-amber-300 hover:bg-amber-50"
                        }`}
                    >
                      {t('services.all_categories')}
                      <Badge variant="secondary" className="ml-2 bg-white/20 text-current">
                        {allFacilities.length}
                      </Badge>
                    </motion.button>

                    {serviceCategories.map((category) => {
                      const IconComponent = category.icon
                      return (
                        <motion.button
                          key={category.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedCategoryFilter(category.name)}
                          className={`px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${selectedCategoryFilter === category.name
                            ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-lg"
                            : "bg-white text-gray-700 border border-gray-300 hover:border-amber-300 hover:bg-amber-50"
                            }`}
                        >
                          <IconComponent className="w-4 h-4" />
                          {translateField(category, i18n.language, "name")}
                          <Badge variant="secondary" className="ml-1 bg-white/20 text-current">
                            {category.facilities.length}
                          </Badge>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 w-full">
                  {filteredFacilities.map((facility, index) => (
                    <motion.div
                      key={facility.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-amber-100 hover:border-amber-300 w-full"
                    >
                      {/* Image Section */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={facility.image || "/placeholder.svg"}
                          alt={facility.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-amber-500 text-white font-semibold">{translateField(facility, i18n.language, "category")}</Badge>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button
                            size="sm"
                            className="w-full bg-white/90 text-gray-900 hover:bg-white"
                            onClick={() => handleComparisonSelect(facility.id, comparisonFacilities[0] ? 1 : 0)}
                          >
                            {t('services.add_to_com')}
                          </Button>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-6">
                        <div className="mb-4">
                          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors">
                            {translateField(facility, i18n.language, "name")}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {translateField(facility, i18n.language, "description") || "Premium facility with modern amenities and professional service."}
                          </p>
                        </div>

                        {/* Key Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center p-3 bg-amber-50 rounded-lg">
                            <Users className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                            <p className="text-sm font-semibold text-gray-900">{facility.capacity}</p>
                            <p className="text-xs text-gray-600">{t('services.capacity')}</p>
                          </div>
                          <div className="text-center p-3 bg-amber-50 rounded-lg">
                            <Clock className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                            {facility.category?.toLowerCase() === 'plaza' ? (
                              <p className="text-[10px] font-semibold text-amber-600">
                                {facility.price_per_sqm} {facility.currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")} / m²
                              </p>
                            ) : (
                              <>
                                <p className="text-[10px] font-semibold text-amber-600">
                                  {facility.price_half_day} {facility.currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")} ({t('services.half_day')})
                                </p>
                                <p className="text-[10px] font-semibold text-amber-600">
                                  {facility.price_full_day} {facility.currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")} ({t('services.full_day')})
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Features */}
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">{t('services.key_feat')}:</p>
                          <div className="flex flex-wrap gap-1">
                            {facility.features.slice(0, 4).map((feature, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs border-amber-200 text-amber-700">
                                {i18n.language === 'am' && facility.features_am
                                  ? facility.features_am[idx]
                                  : feature}
                              </Badge>
                            ))}
                            {facility.features.length > 4 && (
                              <Badge variant="outline" className="text-xs border-gray-200 text-gray-500">
                                +{facility.features.length - 4} {t('services.more')}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="flex-1 border-amber-300 text-amber-600 hover:bg-amber-50 bg-transparent"
                            onClick={() => {
                              setSelectedFacilityDetail(facility)
                              setShowFacilityDetail(true)
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {t('services.view_more')}
                          </Button>
                          <Button
                            className="flex-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-semibold group-hover:shadow-lg transition-all duration-300"
                          >
                            <a href="#book-service">
                              {t('services.book_faci')}
                            </a>
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              {/* Facility Comparison Interface */}
              <div className=" mt-4">
                <div className="bg-white rounded-2xl shadow-xl border border-amber-200 overflow-hidden">
                  <div className="bg-white p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('services.comp_faci')}</h3>
                    <p className="text-gray-600">{t('services.comp_faci_desc')}</p>
                  </div>
                  <div className="w-90 h-px bg-amber-500/20 mx-auto mb-6"></div>

                  <div className="p-6">
                    {/* Facility Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">{t('services.first_faci')}</Label>
                        <Select
                          value={comparisonFacilities[0]?.id || ""}
                          onValueChange={(value) => handleComparisonSelect(value, 0)}
                        >
                          <SelectTrigger className="border-amber-200 focus:border-amber-400">
                            <SelectValue placeholder={t('services.choose_faci')} />
                          </SelectTrigger>
                          <SelectContent>
                            {allFacilities.map((facility) => (
                              <SelectItem key={facility.id} value={facility.id}>
                                <div className="flex items-center gap-2">
                                  <Building className="w-4 h-4 text-amber-500" />
                                  {translateField(facility, i18n.language, "name")} - {translateField(facility, i18n.language, "category")}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">{t('services.sec_faci')}</Label>
                        <Select
                          value={comparisonFacilities[1]?.id || ""}
                          onValueChange={(value) => handleComparisonSelect(value, 1)}
                        >
                          <SelectTrigger className="border-amber-200 focus:border-amber-400">
                            <SelectValue placeholder={t('services.choose_faci')} />
                          </SelectTrigger>
                          <SelectContent>
                            {allFacilities
                              .filter((f) => f.id !== comparisonFacilities[0]?.id)
                              .map((facility) => (
                                <SelectItem key={facility.id} value={facility.id}>
                                  <div className="flex items-center gap-2">
                                    <Building className="w-4 h-4 text-amber-500" />
                                    {translateField(facility, i18n.language, "name")} - {translateField(facility, i18n.language, "category")}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Comparison Display */}
                    {comparisonFacilities.filter(Boolean).length > 0 && (
                      <div className="space-y-6">
                        {/* Mobile Comparison - Stacked */}
                        <div className="block md:hidden space-y-6">
                          {comparisonFacilities.filter(Boolean).map((facility, index) => (
                            <div
                              key={facility.id}
                              className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200"
                            >
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xl font-bold text-gray-900">{translateField(facility, i18n.language, "name")}</h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromComparison(index)}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>

                              <div className="aspect-video rounded-lg overflow-hidden mb-4">
                                <img
                                  src={facility.image || "/placeholder.svg"}
                                  alt={facility.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">{t('services.cat')}</span>
                                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                    {translateField(facility, i18n.language, "category")}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">{t('services.cap')}</span>
                                  <span className="font-semibold text-gray-900">{facility.capacity} {t('services.people')}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">{t('services.price')}</span>
                                  <span className="font-bold text-amber-600 text-[10px] text-right">
                                    {facility.category?.toLowerCase() === 'plaza' ? (
                                      <>{facility.price_per_sqm} {facility.currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")} / m²</>
                                    ) : (
                                      <>
                                        {facility.price_half_day} {facility.currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")} ({t('services.half_day')})<br />
                                        {facility.price_full_day} {facility.currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")} ({t('services.full_day')})
                                      </>
                                    )}
                                  </span>
                                </div>
                                <div className="pt-2">
                                  <span className="text-sm text-gray-600 block mb-2">{t('services.key_feat')}</span>
                                  <div className="flex flex-wrap gap-1">
                                    {facility.features.slice(0, 3).map((feature, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {i18n.language === 'am' && facility.features_am
                                          ? facility.features_am[idx]
                                          : feature}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Desktop Comparison - Side by Side */}
                        <div className="hidden md:block">
                          <div className="grid grid-cols-2 gap-6">
                            {[0, 1].map((index) => {
                              const facility = comparisonFacilities[index]
                              return (
                                <div
                                  key={index}
                                  className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200"
                                >
                                  {facility ? (
                                    <>
                                      <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-xl font-bold text-gray-900">{translateField(facility, i18n.language, "name")}</h4>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeFromComparison(index)}
                                          className="text-gray-400 hover:text-red-500"
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>

                                      <div className="aspect-video rounded-lg overflow-hidden mb-4">
                                        <img
                                          src={facility.image || "/placeholder.svg"}
                                          alt={facility.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>

                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm text-gray-600">{t('services.cat')}</span>
                                          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                            {translateField(facility, i18n.language, "category")}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm text-gray-600">{t('services.cap')}</span>
                                          <span className="font-semibold text-gray-900">{facility.capacity} {t('services.people')}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm text-gray-600">{t('services.price')}</span>
                                          <span className="font-bold text-amber-600 text-[10px] text-right">
                                            {facility.category?.toLowerCase() === 'plaza' ? (
                                              <>{facility.price_per_sqm} {facility.currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")} / m²</>
                                            ) : (
                                              <>
                                                {facility.price_half_day} {facility.currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")} ({t('services.half_day')})<br />
                                                {facility.price_full_day} {facility.currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")} ({t('services.full_day')})
                                              </>
                                            )}
                                          </span>
                                        </div>
                                        <div className="pt-2">
                                          <span className="text-sm text-gray-600 block mb-2">{t('services.key_feat')}</span>
                                          <div className="flex flex-wrap gap-1">
                                            {facility.features.slice(0, 3).map((feature, idx) => (
                                              <Badge key={idx} variant="outline" className="text-xs">
                                                {i18n.language === 'am' && facility.features_am
                                                  ? facility.features_am[idx]
                                                  : feature}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="flex items-center justify-center h-64 text-gray-400">
                                      <div className="text-center">
                                        <Building className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>{t('services.se_a_faci')}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Comparison Actions */}
                        {comparisonFacilities.filter(Boolean).length > 0 && (
                          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                            <Button
                              onClick={clearComparison}
                              variant="outline"
                              className="border-gray-300 text-gray-600 hover:bg-gray-50 bg-transparent"
                            >
                              {t('services.clear_com')}
                            </Button>
                            <Button
                              onClick={() => document.querySelector('[id="book-service"]')?.click()}
                              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-semibold"
                            >
                              <a href="#book-service">
                                {t('services.book_se')}
                              </a>
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </section>
        </div>
      </section>

      {/* Services Content */}
      <section className="py-6 bg-gradient-to-b from-white to-gray-50" id="book-service">
        <div className="container mx-auto px-6">
          <div className="mb-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-amber-500 mb-2 font-serif">{t('services.booking_steps')}</h2>
            <div className="w-24 h-px bg-amber-400 mx-auto mb-6"></div>
            <p className="text-gray-600 text-base md:text-lg">{t('services.booking_steps_des')}</p>
          </div>
          <Stepper currentStep={currentStep} />
          <Tabs
            value={tabValue}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 border border-gray-300">
              <TabsTrigger
                value="book-service"
                className="data-[state=active]:bg-amber-500 data-[state=active]:text-black text-gray-900"
              >
                {t('services.book_service')}
              </TabsTrigger>
              {isAuthenticated && (
                <TabsTrigger
                  value="my-bookings"
                  className="data-[state=active]:bg-amber-500 data-[state=active]:text-black text-gray-900"
                >
                  {t('services.my_bookings')}
                </TabsTrigger>
              )}
            </TabsList>


            {/* Book Service Tab */}
            <TabsContent value="book-service">

              <Card ref={bookingCardRef} className="bg-white border-gray-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 text-black">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl"> {t('services.service_booking')}</CardTitle>
                      <CardDescription className="text-black/80">
                        {t('services.step')} {currentStep}  {t('services.of')} {totalSteps}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-black/80 mb-2"> {t('services.progress')}</p>
                      <Progress value={progress} className="w-32 bg-black/20" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  {/* Step 1: Service Selection */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                        {t('services.select_service')}
                        <StepInfo info={t('services.i1')} />
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {serviceCategories.map((service) => {
                          const IconComponent = service.icon
                          return (
                            <Card
                              key={service.id}
                              className={cn(
                                "cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl",
                                selectedService === service.id
                                  ? "bg-amber-500/20 border-amber-400 shadow-lg"
                                  : "bg-gray-50 border-gray-200 shadow-lg hover:border-amber-400",
                              )}
                              onClick={() => handleServiceSelect(service.id)}
                            >
                              <CardContent className="p-6">
                                <div className="flex items-center space-x-4 mb-4">
                                  <div className="p-3 bg-amber-400/20 rounded-lg border border-amber-500/30">
                                    <IconComponent className="w-8 h-8 text-amber-400" />
                                  </div>
                                  <div>
                                    <h4 className="text-xl font-semibold text-gray-900"> {translateField(service, i18n.language, "name")}</h4>
                                    <p className="text-gray-600">{translateField(service, i18n.language, "description")}</p>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center mt-4">
                                  <div className="text-sm text-gray-500">
                                    {service.facilities.length} {t('services.facilities_available')}
                                  </div>
                                  <div className="text-sm font-semibold text-amber-600">
                                    {t('services.starting_from')}{" "}
                                    {service.name?.toLowerCase() === 'plaza' ? (
                                      <>{Math.min(...service.facilities.map((f) => f.price_per_sqm).filter((rate) => rate > 0))}{" "}
                                        {service.facilities[0]?.currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")} / m²</>
                                    ) : (
                                      <>{Math.min(...service.facilities.map((f) => f.price_full_day).filter((rate) => rate > 0))}{" "}
                                        {service.facilities[0]?.currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")} / d</>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={handleNextStep}
                          disabled={!selectedService}
                          className="bg-amber-500 hover:bg-amber-600 text-black px-8 py-3"
                        >
                          {t('services.next')} <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Facility Selection */}
                  {currentStep === 2 && selectedService && (
                    <div className="space-y-6">
                      <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                        {t('services.choose_facility')}
                        <StepInfo info={t('services.i2')} />
                      </h3>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {serviceCategories
                          .find((s) => s.id === selectedService)
                          ?.facilities.map((facility) => (
                            <Card
                              key={facility.id}
                              className={cn(
                                "cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl",
                                selectedFacility?.id === facility.id
                                  ? "bg-amber-500/20 border-amber-400 shadow-lg"
                                  : "bg-gray-50 border-gray-200 shadow-lg hover:border-amber-400",
                              )}
                              onClick={() => handleFacilitySelect(facility)}
                            >
                              <div className="relative h-40">
                                <img
                                  src={facility.image || "/placeholder.svg"}
                                  alt={facility.name}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  className="object-cover rounded-t-lg"
                                />
                              </div>
                              <CardContent className="p-6">
                                <h4 className="text-xl font-semibold text-gray-900 mb-2">{translateField(facility, i18n.language, "name")}</h4>
                                <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-1" />
                                    {facility.capacity}  {t('services.capacity')}
                                  </div>
                                  {facility.category?.toLowerCase() === 'plaza' ? (
                                    <div className="flex items-center">
                                      <Clock className="w-4 h-4 mr-1" />
                                      {t('services.area_sqm')}: {facility.price_per_sqm} {facility.currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")} / m²
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-1" />
                                        {t('services.half_day')}: {facility.price_half_day} {facility.currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")}
                                      </div>
                                      <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-1" />
                                        {t('services.full_day')}: {facility.price_full_day} {facility.currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")}
                                      </div>
                                    </>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  {facility.features.slice(0, 3).map((feature, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="mr-2 mb-2 bg-amber-400/20 text-amber-400 border-amber-500/30"
                                    >
                                      {i18n.language === 'am' && facility.features_am
                                        ? facility.features_am[index]
                                        : feature}
                                    </Badge>
                                  ))}
                                  {facility.features.length > 3 && (
                                    <Badge variant="outline" className="text-gray-500 border-gray-300">
                                      +{facility.features.length - 3}  {t('services.more')}
                                    </Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={handlePrevStep}
                          className="px-8 py-3 bg-transparent border-amber-500/30 text-gray-900 hover:bg-amber-500/10"
                        >
                          <ChevronLeft className="w-4 h-4 mr-2" />  {t('services.previous')}
                        </Button>
                        <Button
                          onClick={handleNextStep}
                          disabled={!selectedFacility}
                          className="bg-amber-500 hover:bg-amber-600 text-black px-8 py-3"
                        >
                          {t('services.next')}  <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Date and Time Selection */}
                  {currentStep === 3 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Calendar Section */}
                      {venueId && (
                        <div className="lg:col-span-1">
                          <div className="bg-white border border-amber-200 rounded-lg p-4">
                            <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                              {t('services.pick_dates')}
                              <StepInfo info={t('services.i3')} />
                            </h3>

                            <div
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            >
                              <div onSubmit={(e) => e.preventDefault()} onReset={(e) => e.preventDefault()}>
                                <CalendarComponent
                                  mode="multiple"
                                  selected={selectedDates}
                                  onSelect={(dates) => {
                                    // Prevent any form submission when selecting dates
                                    handleDateSelect(dates)
                                  }}
                                  className="rounded-md border border-amber-200"
                                  disabled={(date) => {
                                    const isPast = date < new Date().setHours(0, 0, 0, 0)
                                    const key = startOfDay(new Date(date)).getTime() // timestamp key
                                    return isPast || getAllRecurringTime[key]?.timeSlots.length >= 0 // ✅ disable full day unavailable
                                  }}
                                  onDayClick={(e) => e.stopPropagation()}
                                  onMonthChange={(e) => e && e.stopPropagation && e.stopPropagation()}
                                  modifiers={{
                                    fullyUnavailable: Object.keys(getAllRecurringTime)
                                      .filter((key) => getAllRecurringTime[key]?.timeSlots.length >= 0)
                                      .map((d) => new Date(Number(d))),


                                  }}
                                  calendar={i18n.language === 'am' ? 'ethiopian' : 'gregorian'}
                                  locale={i18n.language}
                                  modifiersStyles={{
                                    fullyUnavailable: {
                                      backgroundColor: "#fee2e2",
                                      color: "#dc2626",
                                      cursor: "not-allowed",
                                    },

                                  }}
                                />
                              </div>
                            </div>
                            {/* Calendar Legend */}
                            <div className="mt-2 flex items-center gap-4 text-xs font-serif">
                              <span className="flex items-center gap-1">
                                <span
                                  style={{
                                    background: "#fee2e2",
                                    color: "#dc2626",
                                    borderRadius: "4px",
                                    padding: "2px 6px",
                                    border: "1px solid #dc2626",
                                  }}
                                >
                                  {t('services.red')}
                                </span>
                                <span> {t('services.full_un')}</span>
                              </span>

                            </div>
                            <div className="mt-4 text-sm text-gray-600 font-serif">
                              {t('services.sele_date')}: {selectedDates.length}  {t('services.dates')}{selectedDates.length !== 1 ? "" : ""}
                            </div>
                            {selectedDates.length > 0 && (
                              <div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    clearAllDates()
                                  }}
                                  className="w-full sm:w-auto bg-white border-amber-300  px-4 py-2 hover:text-red-800 rounded-md transition-colors duration-200 font-medium border text-red-600  font-serif"
                                >
                                  {t('services.clear_dates')}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Date Configuration */}
                      <div className="lg:col-span-2 space-y-4">
                        {selectedDates.length === 0 ? (
                          <div className="bg-white border border-amber-200 rounded-lg p-8">
                            <div className="text-center text-gray-500">
                              <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p className="font-serif"> {t('services.date_info')}</p>
                            </div>
                          </div>
                        ) : (
                          selectedDates.map((date) => {
                            const dateKey = format(new Date(date), "yyyy-MM-dd")
                            const dateData = scheduleDates[dateKey]

                            if (!dateData) {
                              return null
                            }

                            return (
                              <div
                                key={dateKey}
                                className="border-l-4 border-l-amber-500 bg-white border border-amber-200 rounded-lg p-4"
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-lg text-amber-600 font-serif font-semibold">
                                    {i18n.language === 'am'
                                      ? formatEthiopian(new Date(date), { amharic: true })
                                      : format(date, "EEEE, MMMM d, yyyy")}
                                  </h4>
                                  {(!unavailableDates[dateKey]) && <button
                                    type="button"
                                    onClick={() => removeDateBlock(dateKey)}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>}
                                </div>

                                {/* Day Selection */}
                                <div className="space-y-4 mb-4">
                                  {(selectedFacility?.category?.toLowerCase() === 'plaza' || editingRequest?.category?.toLowerCase() === 'plaza') ? (
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-700 font-serif">
                                        {t('services.area_sqm')}
                                      </label>
                                      <Input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={dateData.area_sqm}
                                        onChange={(e) => updateDateSettings(dateKey, { area_sqm: e.target.value })}
                                        placeholder={t('services.parea_sqm')}
                                        className="bg-white border-amber-200 text-gray-900 focus:border-amber-500"
                                      />
                                      <p className="text-xs text-gray-500 font-serif">
                                        {t('services.area_desc')}
                                      </p>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700 font-serif">{t('services.select_duration')}</label>
                                        <p className="text-xs text-gray-500 font-serif">
                                          {t('services.duration_desc')}
                                        </p>
                                      </div>
                                      <div className="flex gap-4">
                                        <Button
                                          type="button"
                                          variant={!dateData.isHalfDay ? "default" : "outline"}
                                          onClick={() => updateDateSettings(dateKey, { isHalfDay: false, fullDay: true })}
                                          className={cn(
                                            "flex-1 font-serif",
                                            !dateData.isHalfDay ? "bg-amber-500 text-black hover:bg-amber-600" : "border-amber-200 text-amber-700 hover:bg-amber-50"
                                          )}
                                        >
                                          {t('services.full_day')}
                                        </Button>
                                        <Button
                                          type="button"
                                          variant={dateData.isHalfDay ? "default" : "outline"}
                                          onClick={() => updateDateSettings(dateKey, { isHalfDay: true, fullDay: true })}
                                          className={cn(
                                            "flex-1 font-serif",
                                            dateData.isHalfDay ? "bg-amber-500 text-black hover:bg-amber-600" : "border-amber-200 text-amber-700 hover:bg-amber-50"
                                          )}
                                        >
                                          {t('services.half_day')}
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </div>

                              </div>
                            )
                          })
                        )}
                      </div>
                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={handlePrevStep}
                          className="px-8 py-3 bg-transparent border-amber-500/30 text-gray-900 hover:bg-amber-500/10"
                        >
                          <ChevronLeft className="w-4 h-4 mr-2" /> {t('services.previous1')}
                        </Button>
                        <Button
                          onClick={handleNextStep3}
                          disabled={selectedDates.length === 0}
                          className="bg-amber-500 hover:bg-amber-600 text-black px-8 py-3"
                        >
                          {t('services.next2')} <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>

                    </div>
                  )}

                  {/* Step 4: Additional Services & Details */}
                  {currentStep === 4 && (
                    <div className="space-y-8">
                      {/* Booking Details Form */}
                      <div className="space-y-6">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                          {t('services.details')}
                          <StepInfo info={t('services.i4')} />
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="org-name" className="text-gray-900 font-medium">
                              {t('services.organization_name')} *
                            </Label>
                            <Input
                              id="org-name"
                              value={formData.organizationName}
                              onChange={(e) =>
                                setFormData({ ...formData, organizationName: e.target.value })
                              }
                              className="bg-white border-gray-300 text-gray-900 mt-2 placeholder-gray-500"
                              placeholder={t('services.porganization_name')}
                            />
                            <p className="text-xs text-red-500 mt-1">
                              {fieldErrors.organizationName ||
                                (upErrors.org_name && (fieldErrors.organizationName || upErrors.org_name))}{" "}
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="contact-person" className="text-gray-900 font-medium">
                              {t('services.contact_person')} *
                            </Label>
                            <Input
                              id="contact-person"
                              value={formData.contactPerson}
                              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                              className="bg-white border-gray-300 text-gray-900 mt-2 placeholder-gray-500"
                              placeholder={t('services.pcontact_person')}
                            />
                            <p className="text-xs text-red-500 mt-1">
                              {fieldErrors.contactPerson ||
                                (upErrors.contactPerson && (fieldErrors.contactPerson || upErrors.contactPerson))}{" "}
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="email" className="text-gray-900 font-medium">
                              {t('services.email')} *
                            </Label>
                            <Input
                              disabled={true}
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className="bg-white border-gray-300 text-gray-900 mt-2 placeholder-gray-500"
                              placeholder="Enter email address"
                            />
                            <p className="text-xs text-red-500 mt-1">
                              {fieldErrors.email ||
                                (upErrors.email && (fieldErrors.email || upErrors.email))}{" "}
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="phoneNo" className="text-gray-900 font-medium">
                              {t('services.phone_no')} *
                            </Label>
                            <Input
                              id="phoneNo"
                              value={formData.phoneNo}
                              onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                              className="bg-white border-gray-300 text-gray-900 mt-2 placeholder-gray-500"
                              placeholder={t('services.pphone_no')}
                            />
                            <p className="text-xs text-red-500 mt-1">
                              {fieldErrors.phoneNo ||
                                (upErrors.phoneNo && (fieldErrors.phoneNo || upErrors.phoneNo))}{" "}
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="attendees" className="text-gray-900 font-medium">
                              {t('services.expected_attendees')}
                            </Label>
                            <Input
                              type='number'
                              min='1'
                              id="attendees"
                              value={formData.expectedAttendees}
                              onKeyDown={(e) => {
                                if (e.key === '-' || e.key === 'e') {
                                  e.preventDefault();
                                }
                              }}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^\d]/g, '');
                                setFormData({ ...formData, expectedAttendees: val });
                              }}
                              className="bg-white border-gray-300 text-gray-900 mt-2 placeholder-gray-500"
                              placeholder={t('services.pexpected_attendees')}
                            />
                            <p className="text-xs text-red-500 mt-1">
                              {fieldErrors.expectedAttendees ||
                                (upErrors.expectedAttendees && (fieldErrors.expectedAttendees || upErrors.expectedAttendees))}{" "}
                            </p>
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="attachment" className="text-gray-900 font-medium">
                              {t('services.attachment')}(PDF, Word, or Image) *
                            </Label>
                            <Input
                              id="attachment"
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  setFormData({ ...formData, attachment: file });
                                  setPreviewUrl(URL.createObjectURL(file));
                                }
                              }}
                              className="bg-white border-gray-300 text-gray-900 mt-2 placeholder-gray-500"
                              required
                            />
                            <p className="text-xs text-red-500 mt-1">
                              {fieldErrors.attachment ||
                                (upErrors.attachment && (fieldErrors.attachment || upErrors.attachment))}{" "}
                            </p>

                            {/* Information Box */}
                            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-gray-800">
                              📌 {t('services.info')}
                            </div>
                            {(formData.attachment || formData.file) && (
                              <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                <h4 className="text-sm font-semibold mb-2"> {t('services.file_p')}:</h4>

                                {formData.attachment instanceof File ? (
                                  // 📂 New file upload preview
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">{formData.attachment.name}</span>
                                    <a
                                      href={previewUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-amber-600 underline text-sm"
                                    >
                                      {t('services.view')}
                                    </a>

                                  </div>
                                ) : (
                                  // 🌐 Existing file from DB preview
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">
                                      {formData.file ? formData.file.split("/").pop() : "Attachment"}
                                    </span>
                                    <a
                                      href={formData.file}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-amber-600 underline text-sm"
                                    >
                                      {t('services.view')}
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                        </div>

                      </div>
                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={handlePrevStep}
                          className="px-8 py-3 bg-transparent border-amber-500/30 text-gray-900 hover:bg-amber-500/10"
                        >
                          <ChevronLeft className="w-4 h-4 mr-2" />  {t('services.previous4')}
                        </Button>
                        <Button
                          onClick={() => {
                            // Validate required fields
                            const errors = {}
                            if (!formData.organizationName) errors.organizationName = "Organization name is required"
                            if (!editingRequest && !formData.attachment) errors.attachment = "Please attach request letter"
                            if (!formData.contactPerson) errors.contactPerson = "Contact person is required"
                            // Phone number validation
                            if (!formData.phoneNo) {
                              errors.phoneNo = "Phone number is required"
                            } else {
                              const phoneRegex = /^(?:\+251[79]|0[79])\d{8}$/
                              if (!phoneRegex.test(formData.phoneNo)) {
                                errors.phoneNo =
                                  "Phone number must start with +2519, +2517, 09, or 07 and be followed by 8 digits"
                              }
                            }
                            if (!formData.expectedAttendees) errors.expectedAttendees = "Expected attendees is required"
                            setFieldErrors(errors)
                            if (Object.keys(errors).length === 0) {
                              if (currentStep < totalSteps) {
                                setCurrentStep(currentStep + 1)
                              }
                            }
                          }}
                          disabled={
                            !formData.organizationName ||
                            !formData.contactPerson ||
                            !formData.phoneNo ||
                            !formData.expectedAttendees ||
                            Number(formData.expectedAttendees) <= 0 ||
                            (!editingRequest && !formData.attachment)
                          }
                          className="bg-amber-500 hover:bg-amber-600 text-black px-8 py-3"
                        >
                          {t('services.next4')} <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Review & Submit */}
                  {currentStep === 5 && (
                    <div className="space-y-8">
                      {isSubmitted ? (
                        <div className="text-center py-12">
                          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
                            <CheckCircle className="w-10 h-10 text-blue-400" />
                          </div>
                          <h3 className="text-2xl font-semibold text-gray-900 mb-4">{t('services.su_mess_ti')}</h3>
                          <p className="text-gray-600 mb-6">
                            {t('services.desc1')}{" "}
                            <span className="font-semibold text-amber-500"> {t('services.desc2')}</span>  {t('services.desc3')}
                          </p>
                          <div className="bg-amber-500/20 border border-amber-400/50 rounded-lg p-4 max-w-md mx-auto">
                            <p className="text-sm text-amber-400">
                              <strong> {t('services.desc4')}:</strong>  {t('services.desc5')}
                            </p>
                          </div>
                        </div>

                      ) : (
                        <>
                          <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                            {t('services.rev_booking')}
                            <StepInfo info={t('services.i5')} />
                          </h3>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                              <Card className="bg-white border-gray-200 shadow-lg">
                                <CardHeader className="bg-amber-500 text-black">
                                  <CardTitle> {t('services.book_detail')}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                  <div>
                                    <p className="text-gray-500 text-sm font-medium">{t('services.service')}</p>
                                    <p className="text-gray-900 font-semibold">
                                      {translateField(editingRequest, i18n.language, "venue") || translateField(selectedFacility, i18n.language, "name") || "-"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500 text-sm font-medium">{t('services.date_time')}</p>
                                    <p className="text-gray-900 font-semibold">
                                      {formatDateTimeSlotsState(scheduleDates)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500 text-sm font-medium">{t('services.contact_info')}</p>
                                    <p className="text-gray-900 font-semibold">{formData.organizationName}</p>
                                    <p className="text-gray-900">{formData.email}</p>
                                    <p className="text-gray-900">{formData.contactPerson}</p>
                                    <p className="text-gray-900">{formData.phoneNo}</p>
                                  </div>
                                  {formData.expectedAttendees && (
                                    <div>
                                      <p className="text-gray-500 text-sm font-medium"> {t('services.expected_attendees')}</p>
                                      <p className="text-gray-900">{formData.expectedAttendees}</p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                            <div className="space-y-6">
                              <Card className="bg-white border-gray-200 shadow-lg">
                                <CardHeader className="bg-amber-600 text-black">
                                  <CardTitle> {t('services.price_br')}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                  <div className="flex justify-between">
                                    <span className="text-gray-500"> {t('services.fac_ren')}</span>
                                    <span className="text-gray-900">
                                      {(() => {
                                        const breakdown = Object.entries(scheduleDates).map(([dateKey, dateData]) => {
                                          const facilityData = editingRequest ? (allFacilities.find(f => f.venue_id == editingRequest.venue_id && f.category === editingRequest.category) || editingRequest) : selectedFacility;
                                          const isPlaza = facilityData?.category?.toLowerCase() === 'plaza';
                                          if (isPlaza) {
                                            return `${t('services.area')}: ${dateData.area_sqm || formData.area_sqm}m² x ${facilityData?.price_per_sqm}`;
                                          }
                                          const price = dateData.isHalfDay
                                            ? (facilityData?.price_half_day || 0)
                                            : (facilityData?.price_full_day || 0);
                                          const label = dateData.isHalfDay ? t('services.half_day') : t('services.full_day');
                                          return `${label}: ${Number(price).toFixed(2)}`;
                                        }).join(", ");
                                        return breakdown;
                                      })()}
                                    </span>
                                  </div>
                                  <div className="border-t border-amber-500/30 pt-4">
                                    <div className="flex justify-between text-xl font-bold">
                                      <span className="text-gray-900"> {t('services.total')}</span>
                                      <span className="text-amber-400">
                                        {(() => {
                                          let totalPrice = 0;
                                          const currency = editingRequest?.currency || selectedFacility?.currency || "ETB";
                                          const currencySym = currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB");

                                          Object.entries(scheduleDates).forEach(([dateKey, dateData]) => {
                                            const facilityData = editingRequest ? (allFacilities.find(f => f.venue_id == editingRequest.venue_id && f.category === editingRequest.category) || editingRequest) : selectedFacility;
                                            const isPlaza = facilityData?.category?.toLowerCase() === 'plaza';
                                            if (isPlaza) {
                                              totalPrice += (Number(dateData.area_sqm || formData.area_sqm) || 0) * (Number(facilityData?.price_per_sqm) || 0);
                                            } else {
                                              const price = dateData.isHalfDay
                                                ? (facilityData?.price_half_day || 0)
                                                : (facilityData?.price_full_day || 0);
                                              totalPrice += Number(price);
                                            }
                                          });

                                          return `${Number(totalPrice).toFixed(2)} ${currencySym}`;
                                        })()}
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                              <div className="p-6 bg-blue-500/20 border border-blue-400/50 rounded-lg">
                                <h4 className="text-blue-400 font-semibold mb-3 flex items-center">
                                  <AlertCircle className="w-5 h-5 mr-2" />
                                  {t('services.im_notice')}
                                </h4>
                                <p className="text-blue-300 text-sm leading-relaxed">
                                  {t('services.not_messa')}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <Button
                              variant="outline"
                              onClick={handlePrevStep}
                              className="px-8 py-3 bg-transparent border-amber-500/30 text-gray-900 hover:bg-amber-500/10"
                            >
                              <ChevronLeft className="w-4 h-4 mr-2" />  {t('services.previous5')}
                            </Button>
                            <Button
                              onClick={saveDraft}
                              className="bg-amber-500 hover:bg-amber-600 text-black px-8 py-3"
                            >
                              {editingRequest ? t('services.next6') : t('services.next5')}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* My Bookings Tab */}
            <TabsContent value="my-bookings">
              <Card className="bg-white border-gray-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 text-black">
                  <CardTitle className="text-xl sm:text-2xl">{t('services.my_bookings')}</CardTitle>
                  <CardDescription className="text-black/80 text-sm sm:text-base">
                    {t('services.booking_des')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="space-y-4 sm:space-y-6">
                    {requests.length !== 0 ? (
                      requests.map((booking) => (
                        <Card
                          key={booking.id}
                          className="bg-gray-50 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden"
                        >
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b border-gray-200">
                              <div className="flex-1">
                                <h4 className="text-lg sm:text-xl font-semibold capitalize text-gray-900 mb-1">{booking.venue}</h4>

                              </div>
                              <div className="flex items-center gap-2 self-start sm:self-center">
                                {getStatusIcon(booking)}
                                <Badge className={`${getStatusColor(booking)} text-xs sm:text-sm`}>
                                  {(() => {
                                    let statusKey = booking.status;
                                    if (booking.status === "approved" && booking.paid) {
                                      statusKey = "paid";
                                    }
                                    return t(`services.status_${statusKey}`);
                                  })()}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                              <div className="space-y-1">
                                <p className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wide">
                                  {t('services.organization_name')}
                                </p>
                                <p className="text-sm sm:text-base text-gray-900 font-semibold break-words">
                                  {booking.organizationName}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wide">
                                  {t('services.contact_person')}
                                </p>
                                <p className="text-sm sm:text-base text-gray-900 font-semibold break-words">
                                  {booking.contactPerson}
                                </p>
                              </div>
                              <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                                <p className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wide"> {t('services.email')}</p>
                                <p className="text-sm sm:text-base text-gray-900 font-semibold break-all">{booking.email}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wide">
                                  {t('services.phone_no')}
                                </p>
                                <p className="text-sm sm:text-base text-gray-900 font-semibold">{booking.phoneNo}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wide">
                                  {t('services.date_time')}
                                </p>
                                <p className="text-sm sm:text-base text-gray-900 font-semibold">
                                  {formatDateTimeSlots(booking.date)}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wide">
                                  {t('services.total_amount')}
                                </p>
                                <p className="text-lg sm:text-xl text-amber-600 font-bold">
                                  {Number(booking.amount).toFixed(2)} {booking.currency}
                                </p>
                              </div>
                              {booking.category?.toLowerCase() === 'plaza' && booking.area_sqm && (
                                <div className="space-y-1">
                                  <p className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wide">
                                    {t('services.area')}
                                  </p>
                                  <p className="text-sm sm:text-base text-gray-900 font-semibold">
                                    {booking.area_sqm} m²
                                  </p>
                                </div>
                              )}
                            </div>

                            {booking.file && (
                              <div className="mb-6 p-3 sm:p-4 border border-gray-300 rounded-lg bg-gray-50">
                                <h4 className="text-sm font-semibold mb-3 text-gray-700 flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                    />
                                  </svg>
                                  {t('services.attachment')}
                                </h4>
                                <div className="flex items-center justify-between p-2 bg-white rounded border">
                                  <span className="text-sm text-gray-700 truncate flex-1 mr-2">
                                    {booking.attachment instanceof File
                                      ? booking.attachment.name
                                      : booking.file
                                        ? booking.file.split("/").pop()
                                        : "Attachment"}
                                  </span>
                                  <a
                                    href={booking.attachment instanceof File ? previewUrl : booking.file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-amber-600 hover:text-amber-700 underline text-sm font-medium whitespace-nowrap"
                                  >
                                    {t('services.file_p')}
                                  </a>
                                </div>
                              </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200 sm:items-center justify-between">
                              {booking.status === "approved" && !booking.paid && (
                                <div className="flex flex-col gap-4 w-full max-w-md">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">
                                      {t('services.upload_payment_slip')}
                                    </Label>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => handleSlipFileChange(booking.id, e.target.files[0])}
                                        className="h-9 text-sm border-amber-200 focus:border-amber-500"
                                      />
                                      <Button
                                        size="sm"
                                        className="bg-amber-500 hover:bg-amber-600 text-black font-semibold whitespace-nowrap"
                                        onClick={() => handleSlipUpload(booking.id)}
                                        disabled={isUploadingSlip[booking.id] || !slipFiles[booking.id]}
                                      >
                                        {isUploadingSlip[booking.id] ? (
                                          <div className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4 text-black" viewBox="0 0 24 24">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                            {t('services.uploading')}
                                          </div>
                                        ) : (
                                          t('services.upload')
                                        )}
                                      </Button>
                                    </div>
                                    <p className="text-[10px] text-gray-500">{t('services.payment_slip_hint')}</p>
                                  </div>

                                  {booking.payment_slip && (
                                    <div className="p-2 bg-amber-50 border border-amber-100 rounded flex items-center justify-between">
                                      <span className="text-xs font-medium text-amber-800 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> {t('services.slip_uploaded')}
                                      </span>
                                      <a
                                        href={booking.payment_slip}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-amber-600 hover:text-amber-700 underline font-semibold"
                                      >
                                        {t('services.view_slip')}
                                      </a>
                                    </div>
                                  )}

                                </div>
                              )}

                              {/* Secondary actions */}
                              <div className="flex flex-col sm:flex-row gap-2 order-2 sm:order-none sm:ml-auto">
                                {booking.status === "draft" && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditRequest(booking)}
                                      className="flex items-center gap-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                      </svg>
                                      {t('services.edit_request')}
                                    </Button>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleSubmitDraft(booking.id)}
                                      className="flex items-center gap-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                        />
                                      </svg>
                                      {t('services.submit')}
                                    </Button>
                                  </>
                                )}

                                {["rejected", "draft", "pending"].includes(booking.status) && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleCancelRequest(booking)}
                                    className="flex items-center gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                    {t('services.delete_request')}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      /* Enhanced empty state with better visual design */
                      <div className="text-center py-12 px-4">
                        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2"> {t('services.no_booking')}</h3>
                        <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
                          {t('services.no_message')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
      {showFacilityDetail && selectedFacilityDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="relative">
              {selectedFacilityDetail.video ? (
                <video
                  src={selectedFacilityDetail.video}
                  controls
                  loop
                  className="w-full h-64 object-cover rounded-t-2xl"
                />
              ) : (
                <img
                  src={selectedFacilityDetail.image || "/placeholder.svg"}
                  alt={selectedFacilityDetail.name}
                  className="w-full h-64 object-cover rounded-t-2xl"
                />
              )}
              <button
                onClick={() => setShowFacilityDetail(false)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div >
                <Badge className="bg-amber-500 text-white font-semibold text-lg px-3 py-1">
                  {translateField(selectedFacilityDetail, i18n.language, "category")}
                </Badge>
              </div>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2"> {translateField(selectedFacilityDetail, i18n.language, "name")}</h2>
                <p className="text-lg text-gray-600"> {translateField(selectedFacilityDetail, i18n.language, "description")}</p>
              </div>

              {/* Key Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="text-center p-4 bg-amber-50 rounded-xl">
                  <Users className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{selectedFacilityDetail.capacity}</p>
                  <p className="text-sm text-gray-600"> {t('services.capacity')}</p>
                </div>
                {selectedFacilityDetail.category?.toLowerCase() === 'plaza' ? (
                  <div className="text-center p-4 bg-amber-50 rounded-xl col-span-2">
                    <Clock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-amber-600">
                      {selectedFacilityDetail.price_per_sqm} {selectedFacilityDetail.currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")} / m²
                    </p>
                    <p className="text-sm text-gray-600">Price per Square Meter</p>
                  </div>
                ) : (
                  <>
                    <div className="text-center p-4 bg-amber-50 rounded-xl">
                      <Clock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                      <p className="text-xl font-bold text-amber-600">
                        {selectedFacilityDetail.price_half_day} {selectedFacilityDetail.currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")}
                      </p>
                      <p className="text-sm text-gray-600">{t('services.half_day')}</p>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-xl">
                      <Clock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                      <p className="text-xl font-bold text-amber-600">
                        {selectedFacilityDetail.price_full_day} {selectedFacilityDetail.currency === "USD" ? t("currency.currencyUSD") : t("currency.currencyETB")}
                      </p>
                      <p className="text-sm text-gray-600">{t('services.full_day')}</p>
                    </div>
                  </>
                )}
                <div className="text-center p-4 bg-amber-50 rounded-xl">
                  <MapPin className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-lg font-bold text-gray-900">{translateField(selectedFacilityDetail, i18n.language, "name") || 'Main Building'}</p>
                  <p className="text-sm text-gray-600"> {t('services.location')}</p>
                </div>
              </div>

              {/* Features */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4"> {t('services.key_feat')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedFacilityDetail.features?.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">
                        {i18n.language === 'am' && selectedFacilityDetail.features_am
                          ? selectedFacilityDetail.features_am[idx]
                          : feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Images */}
              {selectedFacilityDetail.gallery && selectedFacilityDetail.gallery.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Gallery</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedFacilityDetail.gallery.map((image, idx) => (
                      <img
                        key={idx}
                        src={image || "/placeholder.svg"}
                        alt={`${selectedFacilityDetail.name} gallery ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-300 bg-transparent"
                  onClick={() => setShowFacilityDetail(false)}
                >
                  {t('services.close')}
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-semibold"
                  onClick={() => {
                    setSelectedFacility(selectedFacilityDetail)
                    setShowFacilityDetail(false)
                    document.querySelector('[value="book-service"]')?.click()
                  }}
                >
                  <a href="#book-service">
                    {t('services.book_this_faci')}
                  </a>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  )
}

