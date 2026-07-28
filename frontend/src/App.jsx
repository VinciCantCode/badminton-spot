import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import {
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Bell,
  X,
  CheckCircle,
  Check,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  Search
} from 'lucide-react'
import './App.css'

// Custom yellow shuttlecock icon representing BadmintonSpot
const ShuttlecockIcon = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Cork base */}
    <path d="M12 20c1.657 0 3-1.343 3-3H9c0 1.657 1.343 3 3 3z" fill="currentColor" />
    {/* Feather cage */}
    <path d="M9 17L5 5h14l-4 12" />
    {/* Inside feathers ribs */}
    <path d="M12 17V5" />
    <path d="M10.5 17l-2.5-12" />
    <path d="M13.5 17l2.5-12" />
    {/* Rib band */}
    <path d="M7.5 11h9" />
    <path d="M6.5 8h11" />
  </svg>
)

// Hardcoded locations for dropdown
const LOCATIONS = [
  { id: 'Delbrook', name: 'Delbrook Community Centre' },
  { id: 'Parkgate', name: 'Parkgate Community Centre' },
  { id: 'Lions Gate', name: 'Lions Gate Community Centre' },
  { id: 'John Braithwaite', name: 'John Braithwaite (JBCC)' },
  { id: 'Lynn Creek', name: 'Lynn Creek Recreation Centre' }
]

// Weekdays mapping
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEKDAY_FULL_NAMES = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday'
}

// Custom Premium Date Picker component matching dark glassmorphism theme
const CustomDatePicker = ({ value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const handlePrevMonth = (e) => {
    e.stopPropagation()
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const handleNextMonth = (e) => {
    e.stopPropagation()
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const handleDaySelect = (dayVal, e) => {
    e.stopPropagation()
    onChange(dayVal)
    setIsOpen(false)
  }

  // Generate calendar days
  const firstDayIndex = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const cells = []
  // Previous month filler days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    const m = month === 0 ? 11 : month - 1
    const y = month === 0 ? year - 1 : year
    const formatted = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, value: formatted, isCurrentMonth: false })
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, value: formatted, isCurrentMonth: true })
  }
  // Next month filler days to complete 42 cells grid (6 rows * 7 columns)
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1
    const y = month === 11 ? year + 1 : year
    const formatted = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, value: formatted, isCurrentMonth: false })
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  // Prettier value format for display box
  const formatDisplayValue = (val) => {
    if (!val) return placeholder
    const [y, m, d] = val.split('-')
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="custom-datepicker-container" ref={containerRef}>
      <div 
        className="custom-datepicker-input glass-panel" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "datepicker-value" : "datepicker-placeholder"}>
          {formatDisplayValue(value)}
        </span>
        <Calendar size={14} className="datepicker-icon" />
      </div>

      {isOpen && (
        <div className="custom-datepicker-dropdown glass-panel">
          <div className="datepicker-header">
            <button className="datepicker-nav-btn" onClick={handlePrevMonth}>&lt;</button>
            <span className="datepicker-month-title">{monthNames[month]} {year}</span>
            <button className="datepicker-nav-btn" onClick={handleNextMonth}>&gt;</button>
          </div>
          
          <div className="datepicker-weekdays">
            <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
          </div>

          <div className="datepicker-days-grid">
            {cells.map((cell, idx) => {
              const isSelected = cell.value === value
              const classes = [
                "datepicker-day-cell",
                cell.isCurrentMonth ? "current-month" : "other-month",
                isSelected ? "selected" : ""
              ].filter(Boolean).join(" ")

              return (
                <div 
                  key={idx} 
                  className={classes}
                  onClick={(e) => handleDaySelect(cell.value, e)}
                >
                  {cell.day}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Custom Premium Multi-Select Location Picker component matching dark glassmorphism theme
const CustomLocationPicker = ({ selected, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggleOption = (optId, e) => {
    e.stopPropagation()
    if (selected.includes(optId)) {
      onChange(selected.filter(item => item !== optId))
    } else {
      onChange([...selected, optId])
    }
  }

  const formatDisplayValue = () => {
    if (selected.length === 0) return placeholder || "All Locations"
    return selected.join(", ")
  }

  return (
    <div className="custom-locationpicker-container" ref={containerRef}>
      <div 
        className="custom-locationpicker-input glass-panel" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selected.length > 0 ? "locationpicker-value" : "locationpicker-placeholder"}>
          {formatDisplayValue()}
        </span>
        <ChevronDown size={14} className="locationpicker-icon" />
      </div>

      {isOpen && (
        <div className="custom-locationpicker-dropdown glass-panel">
          <div className="locationpicker-options-list">
            <div 
              className={`locationpicker-option-item ${selected.length === 0 ? "selected" : ""}`}
              onClick={(e) => {
                e.stopPropagation()
                onChange([])
              }}
            >
              <span>All Locations</span>
            </div>
            {options.map(opt => {
              const isSelected = selected.includes(opt.id)
              return (
                <div 
                  key={opt.id} 
                  className={`locationpicker-option-item ${isSelected ? "selected" : ""}`}
                  onClick={(e) => handleToggleOption(opt.id, e)}
                >
                  <span className="checkbox-custom-indicator">
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span>{opt.id}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Generate time options from 12:00 AM to 11:30 PM in 30-minute intervals
const TIME_OPTIONS = (() => {
  const options = []
  for (let h = 0; h < 24; h++) {
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayHour = h % 12 === 0 ? 12 : h % 12
    const hourStr = String(displayHour).padStart(2, '0')
    options.push(`${hourStr}:00 ${ampm}`)
    options.push(`${hourStr}:30 ${ampm}`)
  }
  return options
})()

// Custom Premium Time Picker component matching dark glassmorphism theme
const CustomTimePicker = ({ value, onChange, placeholder, options }) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="custom-timepicker-container" ref={containerRef}>
      <div 
        className="custom-timepicker-input glass-panel" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "timepicker-value" : "timepicker-placeholder"}>
          {value || placeholder}
        </span>
        <ChevronDown size={14} className="timepicker-icon" />
      </div>

      {isOpen && (
        <div className="custom-timepicker-dropdown glass-panel">
          <div className="timepicker-options-list">
            {options.map(opt => {
              const isSelected = opt === value
              return (
                <div 
                  key={opt} 
                  className={`timepicker-option-item ${isSelected ? "selected" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange(opt)
                    setIsOpen(false)
                  }}
                >
                  {opt}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  // State
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filtering States
  const [selectedLocations, setSelectedLocations] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [selectedDays, setSelectedDays] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAvailableOnly, setShowAvailableOnly] = useState(true)
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [modalLocations, setModalLocations] = useState([])
  const [modalDays, setModalDays] = useState([])
  const [startTimeMin, setStartTimeMin] = useState('00:00:00')
  const [startTimeMax, setStartTimeMax] = useState('23:59:59')
  const [submitting, setSubmitting] = useState(false)
  const [subscribeSuccess, setSubscribeSuccess] = useState(false)

  // Verification Step States
  const [verificationStep, setVerificationStep] = useState(1) // 1: criteria/email, 2: code input
  const [verificationCode, setVerificationCode] = useState('')
  const [verificationError, setVerificationError] = useState('')
  const [sendingCode, setSendingCode] = useState(false)

  // Unsubscribe States
  const [unsubscribeEmail, setUnsubscribeEmail] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('unsubscribe')
  })
  const [unsubscribeToken, setUnsubscribeToken] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('token')
  })
  const [unsubscribing, setUnsubscribing] = useState(false)
  const [unsubscribeSuccess, setUnsubscribeSuccess] = useState(false)
  const [unsubscribeError, setUnsubscribeError] = useState('')

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('')

  // Fetch slots on load
  useEffect(() => {
    fetchSlots()
  }, [])

  const fetchSlots = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('slots')
        .select('*')
        .order('start_time', { ascending: true })

      if (error) throw error
      setSlots(data || [])
    } catch (err) {
      console.error('Error fetching slots:', err)
      setError('Failed to fetch real-time court availability.')
    } finally {
      setLoading(false)
    }
  }

  // Helper to convert UTC ISO-8601 string to Vancouver local date (YYYY-MM-DD)
  const getVancouverDate = (isoStr) => {
    if (!isoStr) return ''
    try {
      const date = new Date(isoStr)
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Vancouver',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      const parts = formatter.formatToParts(date)
      const year = parts.find(p => p.type === 'year').value
      const month = parts.find(p => p.type === 'month').value
      const day = parts.find(p => p.type === 'day').value
      return `${year}-${month}-${day}`
    } catch {
      return ''
    }
  }

  // Helper to convert UTC ISO-8601 string to Vancouver local time (HH:MM)
  const getVancouverTime = (isoStr) => {
    if (!isoStr) return ''
    try {
      const date = new Date(isoStr)
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Vancouver',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      })
      const parts = formatter.formatToParts(date)
      const hour = parts.find(p => p.type === 'hour').value
      const minute = parts.find(p => p.type === 'minute').value
      return `${hour}:${minute}`
    } catch {
      return ''
    }
  }

  // Helper to format slot time range (start to end) in local Vancouver time (e.g. 11:15 am - 12:15 pm)
  const formatTimeRange = (startIso, endIso) => {
    if (!startIso || !endIso) return ''
    try {
      const start = new Date(startIso)
      const end = new Date(endIso)
      const formatTimePart = (date) => {
        return date.toLocaleTimeString('en-US', {
          timeZone: 'America/Vancouver',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).toLowerCase()
      }
      return `${formatTimePart(start)} - ${formatTimePart(end)}`
    } catch {
      return ''
    }
  }

  // Helper to convert time string (12-hour or HH:MM) to minutes since midnight
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return null
    const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i)
    if (match) {
      let hours = parseInt(match[1])
      const minutes = parseInt(match[2])
      const ampm = match[3].toUpperCase()
      if (ampm === 'PM' && hours !== 12) hours += 12
      if (ampm === 'AM' && hours === 12) hours = 0
      return hours * 60 + minutes
    }
    const parts = timeStr.split(':')
    if (parts.length >= 2) {
      const hours = parseInt(parts[0])
      const minutes = parseInt(parts[1])
      return hours * 60 + minutes
    }
    return null
  }

  // Extract unique chronological dates from slots for the dropdown range selectors
  const uniqueDates = React.useMemo(() => {
    const dates = []
    const seen = new Set()
    slots.forEach(slot => {
      if (slot.date_desc && !seen.has(slot.date_desc)) {
        seen.add(slot.date_desc)
        try {
          const rawDateStr = getVancouverDate(slot.start_time)
          dates.push({
            label: slot.date_desc,
            value: rawDateStr
          })
        } catch (e) {
          // ignore parsing error
        }
      }
    })
    return dates
  }, [slots])

  // Weekday filter toggle
  const toggleDayFilter = (dayAbbr) => {
    const fullName = WEEKDAY_FULL_NAMES[dayAbbr]
    setSelectedDays(prev =>
      prev.includes(fullName) ? prev.filter(d => d !== fullName) : [...prev, fullName]
    )
  }

  // Helper to extract weekday from date_desc
  const getWeekdayFromDateDesc = (dateDesc) => {
    if (!dateDesc) return ''
    const match = dateDesc.match(/^([A-Za-z]+),/)
    if (match) {
      const prefix = match[1].toLowerCase()
      const dayMap = {
        mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
        fri: 'Friday', sat: 'Saturday', sun: 'Sunday'
      }
      return dayMap[prefix] || ''
    }
    return ''
  }

  // Helper to check if a slot's end time has passed relative to current time
  const isSlotExpired = (endIsoStr) => {
    if (!endIsoStr) return false
    try {
      const endTime = new Date(endIsoStr).getTime()
      const now = new Date().getTime()
      return endTime < now
    } catch {
      return false
    }
  }

  // Helper to construct direct NVRC booking URL for a specific court slot
  const getBookingUrl = (slot) => {
    if (slot.booking_url) return slot.booking_url
    if (slot.event_id) {
      return `https://nvrc.perfectmind.com/23734/Clients/BookMe4LandingPages/CoursesLandingPage?widgetId=a28b2c65-61af-407f-80d1-eaa58f30a94a&redirectedFromEmbededMode=False&courseId=${slot.event_id}`
    }
    return "https://nvrc.perfectmind.com/23734/Clients/BookMe4BookingPages/BookingCoursesPage?calendarId=107644e1-183f-4052-a809-52e13ec76293&widgetId=a28b2c65-61af-407f-80d1-eaa58f30a94a&embed=False"
  }



  // Filter slots
  const filteredSlots = slots.filter(slot => {
    // 0. Expired slots filter (hide slots that have already passed)
    if (isSlotExpired(slot.end_time || slot.start_time)) {
      return false
    }

    // 1. Availability filter (if checked, hide full slots)
    if (showAvailableOnly && slot.spots_count === 0) {
      return false
    }

    // 2. Location filter
    if (selectedLocations.length > 0) {
      const match = selectedLocations.some(loc => 
        slot.location_name.toLowerCase().includes(loc.toLowerCase())
      )
      if (!match) return false
    }

    // 3. Date Range filter
    if (startDate || endDate) {
      try {
        const slotDateStr = getVancouverDate(slot.start_time)
        if (startDate && slotDateStr < startDate) return false
        if (endDate && slotDateStr > endDate) return false
      } catch {
        return false
      }
    }

    // 3.5 Time Range filter
    if (startTime || endTime) {
      const slotStartMin = timeToMinutes(getVancouverTime(slot.start_time))
      const slotEndMin = timeToMinutes(getVancouverTime(slot.end_time))
      
      if (startTime && slotStartMin !== null) {
        const startMin = timeToMinutes(startTime)
        if (startMin !== null && slotStartMin < startMin) return false
      }
      if (endTime && slotEndMin !== null) {
        const endMin = timeToMinutes(endTime)
        if (endMin !== null && slotEndMin > endMin) return false
      }
    }

    // 4. Day filter
    if (selectedDays.length > 0) {
      const slotDay = getWeekdayFromDateDesc(slot.date_desc)
      if (!selectedDays.includes(slotDay)) return false
    }

    // 5. Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchName = slot.event_name.toLowerCase().includes(query)
      const matchLoc = slot.location_name.toLowerCase().includes(query)
      if (!matchName && !matchLoc) return false
    }

    return true
  })

  // Pre-fill modal when clicking "Alert Me" on a full card
  const handleAlertMeClick = (slot) => {
    // Match location
    const matchedLoc = LOCATIONS.find(loc =>
      slot.location_name.toLowerCase().includes(loc.id.toLowerCase())
    )
    setModalLocations(matchedLoc ? [matchedLoc.id] : [])

    // Match weekday
    const slotDay = getWeekdayFromDateDesc(slot.date_desc)
    setModalDays(slotDay ? [slotDay] : [])

    // Parse start time to prefill
    try {
      const dateObj = new Date(slot.start_time)
      const minHour = String(Math.max(0, dateObj.getHours() - 1)).padStart(2, '0')
      const maxHour = String(Math.min(23, dateObj.getHours() + 1)).padStart(2, '0')
      
      setStartTimeMin(`${minHour}:00:00`)
      setStartTimeMax(`${maxHour}:00:00`)
    } catch {
      setStartTimeMin('00:00:00')
      setStartTimeMax('23:59:59')
    }

    setSubscribeSuccess(false)
    setVerificationStep(1)
    setVerificationCode('')
    setVerificationError('')
    setIsModalOpen(true)
  }

  // Open empty modal
  const handleNewAlertClick = () => {
    setModalLocations([])
    setModalDays([])
    setStartTimeMin('00:00:00')
    setStartTimeMax('23:59:59')
    setSubscribeSuccess(false)
    setVerificationStep(1)
    setVerificationCode('')
    setVerificationError('')
    setIsModalOpen(true)
  }

  // Phase 1: Send Verification Code to Email
  const handleSendCodeSubmit = async (e) => {
    e.preventDefault()
    if (!email) return

    setSendingCode(true)
    setVerificationError('')
    try {
      const response = await fetch('/api/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          locations: modalLocations.length > 0 ? modalLocations : LOCATIONS.map(l => l.id),
          weekdays: modalDays.length > 0 ? modalDays : Object.values(WEEKDAY_FULL_NAMES),
          start_time_min: startTimeMin,
          start_time_max: startTimeMax
        })
      })

      let result = {}
      try {
        result = await response.json()
      } catch {
        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}. API endpoint is unreachable in local Vite dev mode. Please test on Vercel or run 'npx vercel dev'.`)
        }
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send verification code')
      }

      setVerificationStep(2)
      showToast('Verification code sent to your email!')
    } catch (err) {
      console.error('Error sending code:', err)
      setVerificationError(err.message || 'Failed to send verification code. Please try again.')
    } finally {
      setSendingCode(false)
    }
  }

  // Phase 2: Verify Code and Save Subscription
  const handleVerifyCodeSubmit = async (e) => {
    e.preventDefault()
    if (!email || !verificationCode) return

    setSubmitting(true)
    setVerificationError('')
    try {
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: verificationCode
        })
      })

      let result = {}
      try {
        result = await response.json()
      } catch {
        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}. API endpoint is unreachable in local Vite dev mode. Please test on Vercel or run 'npx vercel dev'.`)
        }
      }

      if (!response.ok) {
        throw new Error(result.error || 'Invalid verification code')
      }

      setSubscribeSuccess(true)
      showToast('Subscription verified successfully!')
    } catch (err) {
      console.error('Error verifying code:', err)
      setVerificationError(err.message || 'Verification failed. Please check the code.')
    } finally {
      setSubmitting(false)
    }
  }

  // Toast helper
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage('')
    }, 4000)
  }

  // Toggle checklist in modal
  const handleModalLocationToggle = (locId) => {
    setModalLocations(prev =>
      prev.includes(locId) ? prev.filter(id => id !== locId) : [...prev, locId]
    )
  }

  const handleModalDayToggle = (dayName) => {
    setModalDays(prev =>
      prev.includes(dayName) ? prev.filter(d => d !== dayName) : [...prev, dayName]
    )
  }

  // Handle Unsubscribe Action
  const handleConfirmUnsubscribe = async () => {
    if (!unsubscribeToken) {
      setUnsubscribeError('Security token is missing. Cannot verify request.')
      return
    }
    setUnsubscribing(true)
    setUnsubscribeError('')
    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unsubscribeEmail, token: unsubscribeToken })
      })

      let result = {}
      try {
        result = await response.json()
      } catch {
        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}. API endpoint is unreachable in local Vite dev mode. Please test on Vercel or run 'npx vercel dev'.`)
        }
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process unsubscribe request')
      }

      setUnsubscribeSuccess(true)
      showToast('Successfully unsubscribed!')
    } catch (err) {
      console.error('Error during unsubscribe:', err)
      setUnsubscribeError(err.message || 'Failed to unsubscribe. Please try again.')
    } finally {
      setUnsubscribing(false)
    }
  }

  // Conditional Rendering for Unsubscribe View
  if (unsubscribeEmail) {
    return (
      <div className="unsubscribe-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(11, 15, 25, 0.15), rgba(11, 15, 25, 0.45)), url("/bg-court.jpg") no-repeat 25% 90% fixed', backgroundSize: 'cover', padding: '20px' }}>
        <div className="unsubscribe-card glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '40px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', textAlign: 'center' }}>
          <ShuttlecockIcon className="brand-icon" size={48} style={{ margin: '0 auto 20px', color: 'var(--accent-neon)' }} />
          
          {!unsubscribeSuccess ? (
            <>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '15px' }}>Cancel Court Alerts</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', marginBottom: '25px' }}>
                Are you sure you want to stop receiving all live badminton court alerts for:
                <strong style={{ display: 'block', color: 'var(--accent-neon)', fontSize: '18px', marginTop: '10px', wordBreak: 'break-all' }}>{unsubscribeEmail}</strong>
              </p>

              {unsubscribeError && (
                <div style={{ color: '#ef4444', marginBottom: '20px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                  <AlertTriangle size={16} />
                  <span>{unsubscribeError}</span>
                </div>
              )}

              <button 
                onClick={handleConfirmUnsubscribe}
                disabled={unsubscribing}
                className="submit-btn"
                style={{ width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold', borderRadius: '8px', border: 'none', background: 'var(--accent-neon)', color: '#090d16', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 4px 14px rgba(223, 255, 0, 0.2)', marginBottom: '20px' }}
              >
                {unsubscribing ? 'Processing...' : 'Confirm Unsubscribe'}
              </button>

              <button 
                onClick={() => {
                  setUnsubscribeEmail(null)
                  setUnsubscribeToken(null)
                  window.history.pushState({}, '', '/')
                }}
                className="back-to-step1-btn"
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline', width: '100%', textAlign: 'center' }}
              >
                Cancel and Go to Dashboard
              </button>
            </>
          ) : (
            <>
              <CheckCircle size={64} style={{ color: 'var(--accent-neon)', margin: '0 auto 20px' }} />
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '15px' }}>Unsubscribed Successfully</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', marginBottom: '30px' }}>
                You have been removed from all monitoring lists. You will no longer receive any alert emails at:
                <strong style={{ display: 'block', color: 'var(--text-primary)', marginTop: '8px', wordBreak: 'break-all' }}>{unsubscribeEmail}</strong>
              </p>
              <button 
                onClick={() => {
                  setUnsubscribeEmail(null)
                  setUnsubscribeToken(null)
                  window.history.pushState({}, '', '/')
                }}
                className="submit-btn"
                style={{ width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold', borderRadius: '8px', border: 'none', background: 'var(--accent-neon)', color: '#090d16', cursor: 'pointer', transition: 'all 0.3s ease' }}
              >
                Go to Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <ShuttlecockIcon className="brand-icon" size={32} />
          <div>
            <h1 className="brand-title">Badminton<span>Spot</span></h1>
            <p className="brand-subtitle">Court Reservation Dashboard</p>
          </div>
        </div>
        
        <div className="header-right">
          <div className="sync-status">
            <span className="status-dot"></span>
            <span>Live Sync</span>
            <button 
              onClick={fetchSlots} 
              className="refresh-btn" 
              title="Refresh availability"
            >
              <RefreshCw size={14} className={loading ? "spinner" : ""} />
            </button>
          </div>
          <div className="notification-icon-container">
            <Bell size={20} className="bell-icon" />
            <span className="bell-badge"></span>
          </div>
          <div className="user-profile">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Avatar" className="avatar-img" />
            <span className="user-name">Alex R.</span>
            <ChevronDown size={14} className="user-chevron" />
          </div>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <div className="main-content-layout">
        
        {/* Left Hero Column */}
        <div className="left-hero">
          <h2 className="hero-title">Find & Reserve Your Court</h2>
          <p className="hero-subtitle">
            Filter available courts or set alerts for your preferred times.
          </p>
        </div>

        {/* Right Dashboard Column */}
        <div className="right-dashboard">
          
          {/* Horizontal Filters Bar */}
          <section className="filters-bar-horizontal glass-panel">
            {/* Location Selector */}
            <div className="horizontal-filter-item">
              <span className="horizontal-filter-label">Locations</span>
              <CustomLocationPicker
                selected={selectedLocations}
                onChange={setSelectedLocations}
                options={LOCATIONS}
                placeholder="All Locations"
              />
            </div>

            {/* Date Range Selector */}
            <div className="horizontal-filter-item date-range-filter-item">
              <div className="filter-label-row">
                <span className="horizontal-filter-label">Date Range</span>
                {(startDate || endDate) && (
                  <button 
                    onClick={() => { setStartDate(''); setEndDate(''); }} 
                    className="filter-reset-link"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="date-range-inputs">
                <CustomDatePicker
                  value={startDate}
                  onChange={(val) => {
                    setStartDate(val)
                    if (endDate && val > endDate) setEndDate('')
                  }}
                  placeholder="Start Date"
                />
                <span className="date-range-separator">-</span>
                <CustomDatePicker
                  value={endDate}
                  onChange={(val) => {
                    setEndDate(val)
                    if (startDate && val < startDate) setStartDate('')
                  }}
                  placeholder="End Date"
                />
              </div>
            </div>

            {/* Search Input */}
            <div className="horizontal-filter-item">
              <span className="horizontal-filter-label">&nbsp;</span>
              <div className="search-input-container">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            {/* Time Range Selector */}
            <div className="horizontal-filter-item time-range-filter-item">
              <div className="filter-label-row">
                <span className="horizontal-filter-label">Time Range</span>
                {(startTime || endTime) && (
                  <button 
                    onClick={() => { setStartTime(''); setEndTime(''); }} 
                    className="filter-reset-link"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="time-range-inputs">
                <CustomTimePicker
                  value={startTime}
                  onChange={(val) => {
                    setStartTime(val)
                    if (endTime) {
                      const startMin = timeToMinutes(val)
                      const endMin = timeToMinutes(endTime)
                      if (startMin !== null && endMin !== null && startMin > endMin) setEndTime('')
                    }
                  }}
                  placeholder="Start Time"
                  options={TIME_OPTIONS}
                />
                <span className="time-range-separator">-</span>
                <CustomTimePicker
                  value={endTime}
                  onChange={(val) => {
                    setEndTime(val)
                    if (startTime) {
                      const startMin = timeToMinutes(startTime)
                      const endMin = timeToMinutes(val)
                      if (startMin !== null && endMin !== null && startMin > endMin) setStartTime('')
                    }
                  }}
                  placeholder="End Time"
                  options={TIME_OPTIONS}
                />
              </div>
            </div>

            {/* Weekdays pills */}
            <div className="horizontal-filter-item flex-grow">
              <span className="horizontal-filter-label">Weekdays</span>
              <div className="filter-pills-row">
                {WEEKDAYS.map(day => {
                  const fullName = WEEKDAY_FULL_NAMES[day]
                  const isActive = selectedDays.includes(fullName)
                  return (
                    <button
                      key={day}
                      onClick={() => toggleDayFilter(day)}
                      className={`filter-pill-small ${isActive ? 'active' : ''}`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Toggle Control Row */}
          <div className="toggle-controls-row">
            <div 
              className={`toggle-container ${showAvailableOnly ? 'active' : ''}`}
              onClick={() => setShowAvailableOnly(!showAvailableOnly)}
            >
              <div className="toggle-switch"></div>
              <span className="toggle-label">Show Available Only</span>
            </div>
            <button onClick={handleNewAlertClick} className="subscribe-btn-main">
              <Bell size={16} />
              <span>Create Alert</span>
            </button>
          </div>

          {/* Slots List View */}
          <div className="dashboard-content-area">
            {loading ? (
              <div className="empty-state glass-panel">
                <RefreshCw size={48} className="spinner empty-icon" />
                <h2 className="empty-title">Loading courts...</h2>
                <p className="empty-desc">Fetching live booking availability from NVRC PerfectMind.</p>
              </div>
            ) : error ? (
              <div className="empty-state glass-panel">
                <AlertTriangle size={48} className="empty-icon" style={{ color: '#ef4444' }} />
                <h2 className="empty-title">Error Loading Data</h2>
                <p className="empty-desc">{error}</p>
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="empty-state glass-panel">
                <Calendar size={48} className="empty-icon" />
                <h2 className="empty-title">No courts found</h2>
                <p className="empty-desc">Adjust your filters or toggle "Show Available Only" to view booked/full schedules.</p>
              </div>
            ) : (
              <div className="slots-container">
                {filteredSlots.map(slot => {
                  const isFull = slot.spots_count === 0
                  // Parse date to prettier format
                  const rawDate = slot.date_desc || ''
                  const timeRange = formatTimeRange(slot.start_time, slot.end_time)

                  return (
                    <div key={slot.event_id} className="slot-card glass-panel">
                      <div className="slot-header">
                        <span className="location-tag">{slot.location_name.split(' ')[0]}</span>
                        <span className={`status-badge ${isFull ? 'full' : 'available'}`}>
                          {isFull ? 'Full' : 'Available'}
                        </span>
                      </div>

                      <h3 className="slot-title">{slot.event_name}</h3>

                      <div className="slot-details">
                        <div className="detail-item">
                          <Calendar size={14} className="detail-icon" />
                          <span>{rawDate}</span>
                        </div>
                        <div className="detail-item">
                          <Clock size={14} className="detail-icon" />
                          <span>{timeRange}</span>
                        </div>
                        <div className="detail-item">
                          <MapPin size={14} className="detail-icon" />
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={slot.location_name}>
                            {slot.location_name}
                          </span>
                        </div>
                      </div>

                      <div className="slot-footer">
                        <span className="slot-price">${slot.price.toFixed(2)}</span>
                        {isFull ? (
                          <button 
                            onClick={() => handleAlertMeClick(slot)} 
                            className="action-btn alert"
                          >
                            <Bell size={14} />
                            <span>Alert Me</span>
                          </button>
                        ) : (
                          <a 
                            href={getBookingUrl(slot)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="action-btn book"
                            style={{ textDecoration: 'none' }}
                          >
                            <span>{slot.button_text || 'Book Now'}</span>
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Subscription Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
              <X size={24} />
            </button>

            {!subscribeSuccess ? (
              <>
                {verificationStep === 1 ? (
                  <>
                    <h2 className="modal-title">🔔 Create Court Alert</h2>
                    <form onSubmit={handleSendCodeSubmit}>
                      {/* Email */}
                      <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. yourname@domain.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="form-input"
                        />
                      </div>

                      {/* Locations */}
                      <div className="form-group">
                        <label className="form-label">Locations (Select to Filter)</label>
                        <div className="checkbox-grid">
                          {LOCATIONS.map(loc => (
                            <label key={loc.id} className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={modalLocations.includes(loc.id)}
                                onChange={() => handleModalLocationToggle(loc.id)}
                              />
                              <span className="checkbox-custom">
                                {modalLocations.includes(loc.id) && <CheckCircle size={14} />}
                              </span>
                              <span>{loc.id}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Weekdays */}
                      <div className="form-group">
                        <label className="form-label">Weekdays</label>
                        <div className="checkbox-grid">
                          {Object.keys(WEEKDAY_FULL_NAMES).map(dayAbbr => {
                            const fullName = WEEKDAY_FULL_NAMES[dayAbbr]
                            return (
                              <label key={dayAbbr} className="checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={modalDays.includes(fullName)}
                                  onChange={() => handleModalDayToggle(fullName)}
                                />
                                  <span className="checkbox-custom">
                                    {modalDays.includes(fullName) && <CheckCircle size={14} />}
                                  </span>
                                <span>{dayAbbr}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      {/* Time Range */}
                      <div className="form-group">
                        <label className="form-label">Preferred Time Range</label>
                        <div className="time-range-group">
                          <select
                            value={startTimeMin}
                            onChange={(e) => setStartTimeMin(e.target.value)}
                            className="time-select"
                          >
                            <option value="00:00:00">Any Time</option>
                            <option value="06:00:00">After 6:00 AM</option>
                            <option value="09:00:00">After 9:00 AM</option>
                            <option value="12:00:00">After 12:00 PM</option>
                            <option value="15:00:00">After 3:00 PM</option>
                            <option value="17:00:00">After 5:00 PM</option>
                            <option value="18:00:00">After 6:00 PM</option>
                            <option value="19:00:00">After 7:00 PM</option>
                          </select>
                          <span style={{ color: 'var(--text-secondary)' }}>to</span>
                          <select
                            value={startTimeMax}
                            onChange={(e) => setStartTimeMax(e.target.value)}
                            className="time-select"
                          >
                            <option value="23:59:59">End of Day</option>
                            <option value="12:00:00">Before 12:00 PM</option>
                            <option value="15:00:00">Before 3:00 PM</option>
                            <option value="17:00:00">Before 5:00 PM</option>
                            <option value="19:00:00">Before 7:00 PM</option>
                            <option value="21:00:00">Before 9:00 PM</option>
                            <option value="22:00:00">Before 10:00 PM</option>
                          </select>
                        </div>
                      </div>

                      {verificationError && (
                        <div className="modal-error-box" style={{ color: '#ef4444', marginBottom: '15px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <AlertTriangle size={16} />
                          <span>{verificationError}</span>
                        </div>
                      )}

                      <button type="submit" disabled={sendingCode} className="submit-btn">
                        {sendingCode ? 'Sending verification code...' : 'Send Verification Code'}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <h2 className="modal-title">🔐 Verify Your Email</h2>
                    <form onSubmit={handleVerifyCodeSubmit}>
                      <div className="form-group">
                        <label className="form-label" style={{ marginBottom: '8px' }}>
                          We sent a 6-digit verification code to:
                          <strong style={{ display: 'block', color: 'var(--text-primary)', marginTop: '4px' }}>{email}</strong>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="e.g. 123456"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          className="form-input"
                          style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
                        />
                      </div>

                      {verificationError && (
                        <div className="modal-error-box" style={{ color: '#ef4444', marginBottom: '15px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <AlertTriangle size={16} />
                          <span>{verificationError}</span>
                        </div>
                      )}

                      <button type="submit" disabled={submitting} className="submit-btn" style={{ marginBottom: '15px' }}>
                        {submitting ? 'Verifying...' : 'Verify & Subscribe'}
                      </button>

                      <button 
                        type="button" 
                        onClick={() => setVerificationStep(1)} 
                        className="back-to-step1-btn"
                        style={{ background: 'none', border: 'none', color: 'var(--accent-neon)', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline', width: '100%', textAlign: 'center' }}
                      >
                        Change email or subscription settings
                      </button>
                    </form>
                  </>
                )}
              </>
            ) : (
              <div className="success-state">
                <CheckCircle className="success-icon" size={64} />
                <h2 className="modal-title" style={{ marginBottom: '8px' }}>Subscription Verified!</h2>
                <p className="success-desc">
                  Your email has been verified. We are now monitoring court times for you. As soon as a court slot matches your criteria, we will email you at:
                  <br />
                  <strong style={{ color: 'var(--accent-neon)', display: 'block', marginTop: '8px' }}>{email}</strong>
                </p>
                <button onClick={() => setIsModalOpen(false)} className="submit-btn" style={{ marginTop: '20px' }}>
                  Awesome, Thanks!
                </button>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification glass-panel">
          <CheckCircle size={18} className="toast-icon" />
          <span className="toast-message">{toastMessage}</span>
        </div>
      )}
    </div>
  )
}

export default App
