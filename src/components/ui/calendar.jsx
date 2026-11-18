"use client"

import { useState } from "react"
import { gregorianToEthiopian, ethiopianToGregorian } from "../../utils/ethiopianDate.js"
import { ChevronLeft, ChevronRight } from "lucide-react"

const CalendarC = ({
  mode = "single",
  selected = [],
  onSelect,
  disabled,
  modifiers = {},
  modifiersStyles = {},
  // calendar: 'gregorian' or 'ethiopian'
  calendar = "gregorian",
  // locale: 'en' or 'am' mainly for labels
  locale = "en",
  className = "",
}) => {
  const [currentDate, setCurrentDate] = useState(new Date())

  const today = new Date()

  const isEthiopian = calendar === "ethiopian"

  // We'll keep `currentDate` as a Gregorian Date internally. For Ethiopian
  // calendar mode we compute the Ethiopian year/month from that and convert
  // to/from Gregorian when rendering and selecting.
  let year
  let month
  if (!isEthiopian) {
    year = currentDate.getFullYear()
    month = currentDate.getMonth()
  } else {
    const eth = gregorianToEthiopian(currentDate)
    year = eth.year // Ethiopian year
    month = eth.month // Ethiopian month (1-based)
  }

  // For Gregorian calendar use JS Date to know the month start/day counts.
  let firstDayOfWeek
  let daysInMonth
  if (!isEthiopian) {
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    firstDayOfWeek = firstDayOfMonth.getDay()
    daysInMonth = lastDayOfMonth.getDate()
  } else {
    // For Ethiopian months we convert the 1st of the Ethiopian month to
    // Gregorian to find the weekday, and compute days (30 for months 1-12,
    // 5 or 6 for month 13 depending on leap year)
    const gFirst = ethiopianToGregorian(year, month, 1)
    const firstDayDate = new Date(gFirst.year, gFirst.month - 1, gFirst.day)
    firstDayOfWeek = firstDayDate.getDay()
    const isEthLeap = (yr) => yr % 4 === 3
    daysInMonth = month <= 12 ? 30 : isEthLeap(year) ? 6 : 5
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const monthNamesAm = [
    "መስከረም",
    "ጥቅምት",
    "ህዳር",
    "ታህሳስ",
    "ጥር",
    "የካቲት",
    "መጋቢት",
    "ሚያዝያ",
    "ግንቦት",
    "ሰኔ",
    "ሐምሌ",
    "ነሐሴ",
    "ጳጉሜን",
  ]

  const monthNamesEthEn = [
    "Meskerem",
    "Tikimt",
    "Hidar",
    "Tahsas",
    "Tir",
    "Yekatit",
    "Megabit",
    "Miazia",
    "Ginbot",
    "Sene",
    "Hamle",
    "Nehase",
    "Pagumen",
  ]

  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
  const dayNamesAm = ["እሑ", "ሰ", "ማ", "እሮ", "ሐ", "አ", "ቅ"]

  const goToPreviousMonth = () => {
    if (!isEthiopian) {
      setCurrentDate(new Date(year, month - 1, 1))
    } else {
      let newMonth = month - 1
      let newYear = year
      if (newMonth < 1) {
        newMonth = 13
        newYear -= 1
      }
      const g = ethiopianToGregorian(newYear, newMonth, 1)
      setCurrentDate(new Date(g.year, g.month - 1, g.day))
    }
  }

  const goToNextMonth = () => {
    if (!isEthiopian) {
      setCurrentDate(new Date(year, month + 1, 1))
    } else {
      let newMonth = month + 1
      let newYear = year
      if (newMonth > 13) {
        newMonth = 1
        newYear += 1
      }
      const g = ethiopianToGregorian(newYear, newMonth, 1)
      setCurrentDate(new Date(g.year, g.month - 1, g.day))
    }
  }

  const handleDateClick = (day) => {
    // Convert clicked visual day into the actual Gregorian date that backs
    // the calendar (Gregorian Date objects are used for callbacks & checks)
    const clickedDate = !isEthiopian
      ? new Date(year, month, day)
      : (() => {
          const g = ethiopianToGregorian(year, month, day)
          return new Date(g.year, g.month - 1, g.day)
        })()

    if (isDateDisabled(day)) return

    if (mode === "multiple") {
      const selectedDates = Array.isArray(selected) ? selected : []
      const dateExists = selectedDates.some((date) => date.getTime() === clickedDate.getTime())

      let newSelected
      if (dateExists) {
        newSelected = selectedDates.filter((date) => date.getTime() !== clickedDate.getTime())
      } else {
        newSelected = [...selectedDates, clickedDate]
      }

      onSelect?.(newSelected)
    } else {
      onSelect?.(clickedDate)
    }
  }

  const isDateSelected = (day) => {
    const date = !isEthiopian
      ? new Date(year, month, day)
      : (() => {
          const g = ethiopianToGregorian(year, month, day)
          return new Date(g.year, g.month - 1, g.day)
        })()
    if (mode === "multiple") {
      const selectedDates = Array.isArray(selected) ? selected : []
      return selectedDates.some((selectedDate) => selectedDate.getTime() === date.getTime())
    }
    return selected && selected.getTime() === date.getTime()
  }

  const isDateDisabled = (day) => {
    const date = !isEthiopian
      ? new Date(year, month, day)
      : (() => {
          const g = ethiopianToGregorian(year, month, day)
          return new Date(g.year, g.month - 1, g.day)
        })()

    // Handle different types of disabled prop
    if (typeof disabled === "function") {
      return disabled(date)
    } else if (typeof disabled === "boolean") {
      return disabled
    } else if (Array.isArray(disabled)) {
      return disabled.some((disabledDate) => disabledDate.getTime() === date.getTime())
    }

    return false
  }

  const getDateModifiers = (day) => {
    const date = !isEthiopian
      ? new Date(year, month, day)
      : (() => {
          const g = ethiopianToGregorian(year, month, day)
          return new Date(g.year, g.month - 1, g.day)
        })()
    const dateModifiers = []

    Object.entries(modifiers).forEach(([key, dates]) => {
      if (!Array.isArray(dates)) return
      if (dates.some((d) => d.getTime() === date.getTime())) {
        dateModifiers.push(key)
      }
    })

    return dateModifiers
  }

  const getDateStyles = (day) => {
    const dateModifiers = getDateModifiers(day)
    let styles = {}

    dateModifiers.forEach((modifier) => {
      if (modifiersStyles[modifier]) {
        styles = { ...styles, ...modifiersStyles[modifier] }
      }
    })

    return styles
  }

  const renderCalendarDays = () => {
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = isDateSelected(day)
      const isDisabled = isDateDisabled(day)
      const customStyles = getDateStyles(day)

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={isDisabled}
          className={`
            h-9 w-9 text-sm rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500
            ${isSelected ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
            ${isDisabled ? "text-gray-400 cursor-not-allowed hover:bg-transparent" : ""}
          `}
          style={customStyles}
        >
          {day}
        </button>,
      )
    }

    return days
  }

  return (
    <div className={`p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={goToPreviousMonth} className="p-1 hover:bg-gray-100 rounded-md">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-semibold">
          {isEthiopian
            ? (locale === "am" ? monthNamesAm[month - 1] : monthNamesEthEn[month - 1])
            : monthNames[month]}{' '}
          {year}
        </h2>
        <button onClick={goToNextMonth} className="p-1 hover:bg-gray-100 rounded-md">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {(locale === 'am' ? dayNamesAm : dayNames).map((day) => (
          <div key={day} className="h-9 w-9 text-xs font-medium text-gray-500 flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
    </div>
  )
}

export { CalendarC }

