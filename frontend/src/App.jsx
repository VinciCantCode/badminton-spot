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
  Search,
  Sliders,
  Edit2,
  Trash2,
  LogOut,
  Plus,
  ShieldCheck,
  AlertCircle
} from 'lucide-react'
import { Analytics } from '@vercel/analytics/react'
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

// Convert 12-hour display string "05:30 PM" to 24-hour SQL string "17:30:00"
const time12to24 = (time12, defaultFallback = '00:00:00') => {
  if (!time12) return defaultFallback
  if (time12 === 'Start of Day') return '00:00:00'
  if (time12 === 'End of Day') return '23:59:59'
  const parts = time12.split(' ')
  if (parts.length !== 2) return defaultFallback
  const [time, modifier] = parts
  const timeSplit = time.split(':')
  if (timeSplit.length !== 2) return defaultFallback
  let [hours, minutes] = timeSplit
  let h = parseInt(hours, 10)
  if (isNaN(h)) return defaultFallback
  if (modifier === 'PM' && h < 12) h += 12
  if (modifier === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${minutes}:00`
}

// Convert 24-hour SQL string "17:30:00" to 12-hour display string "05:30 PM"
const time24to12 = (time24, defaultFallback = '12:00 AM') => {
  if (!time24 || time24 === '00:00:00') return '12:00 AM'
  if (time24 === '23:59:59') return '11:59 PM'
  const timeSplit = time24.split(':')
  if (timeSplit.length < 2) return defaultFallback
  let [hours, minutes] = timeSplit
  let h = parseInt(hours, 10)
  if (isNaN(h)) return defaultFallback
  const ampm = h >= 12 ? 'PM' : 'AM'
  const displayHour = h % 12 === 0 ? 12 : h % 12
  return `${String(displayHour).padStart(2, '0')}:${minutes} ${ampm}`
}


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
  const [unsubscribeToken, setUnsubscribeToken] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('unsubscribe') || params.get('token')
  })

  const [unsubscribing, setUnsubscribing] = useState(false)
  const [unsubscribeSuccess, setUnsubscribeSuccess] = useState(false)
  const [unsubscribeError, setUnsubscribeError] = useState('')

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('')

  // Subscription Management States
  const [sessionToken, setSessionToken] = useState(() => {
    return localStorage.getItem('badminton_session_token') || ''
  })
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [userSubscriptions, setUserSubscriptions] = useState([])
  const [userEmail, setUserEmail] = useState('')
  const [fetchingUserSubs, setFetchingUserSubs] = useState(false)
  const [userSubsError, setUserSubsError] = useState('')

  // Management Modal OTP Login States
  const [manageStep, setManageStep] = useState(1) // 1: Email, 2: Code
  const [manageEmail, setManageEmail] = useState('')
  const [manageCode, setManageCode] = useState('')
  const [manageError, setManageError] = useState('')
  const [manageLoading, setManageLoading] = useState(false)

  // Edit Subscription State
  const [editingSub, setEditingSub] = useState(null)
  const [editLocations, setEditLocations] = useState([])
  const [editDays, setEditDays] = useState([])
  const [editMinTime, setEditMinTime] = useState('00:00:00')
  const [editMaxTime, setEditMaxTime] = useState('23:59:59')

  // Create New Subscription Rule State (within Management Dashboard)
  const [addingNewRule, setAddingNewRule] = useState(false)
  const [newLocations, setNewLocations] = useState([])
  const [newDays, setNewDays] = useState([])
  const [newMinTime, setNewMinTime] = useState('00:00:00')
  const [newMaxTime, setNewMaxTime] = useState('23:59:59')

  const handleStartAddNewRule = () => {
    setAddingNewRule(true)
    setEditingSub(null)
    setNewLocations(LOCATIONS.map(l => l.id))
    setNewDays(Object.values(WEEKDAY_FULL_NAMES))
    setNewMinTime('00:00:00')
    setNewMaxTime('23:59:59')
  }

  const handleCreateNewRuleSubmit = async (e) => {
    e.preventDefault()
    setUserSubsError('')

    if (newLocations.length === 0) {
      setUserSubsError('Please select at least one location.')
      return
    }
    if (newDays.length === 0) {
      setUserSubsError('Please select at least one weekday.')
      return
    }

    try {
      const response = await fetch('/api/user/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          locations: newLocations,
          weekdays: newDays,
          start_time_min: newMinTime,
          start_time_max: newMaxTime
        })
      })
      let res = {}
      try {
        res = await response.json()
      } catch {
        if (!response.ok) throw new Error('API server unreachable.')
      }
      if (!response.ok) throw new Error(res.error || 'Failed to create subscription rule')

      setUserSubscriptions(prev => [res.subscription, ...prev])
      setAddingNewRule(false)
      showToast('New alert rule created successfully!')
    } catch (err) {
      setUserSubsError(err.message || 'Error creating subscription rule.')
    }
  }

  // Helper to fetch user's active subscriptions from serverless API

  const fetchUserSubscriptions = async (tokenOverride) => {
    const tokenToUse = tokenOverride || sessionToken
    if (!tokenToUse) return

    setFetchingUserSubs(true)
    setUserSubsError('')
    try {
      const response = await fetch('/api/user/subscriptions', {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`
        }
      })
      let res = {}
      try {
        res = await response.json()
      } catch {
        if (!response.ok) {
          throw new Error('API server unreachable in static dev server mode.')
        }
      }
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('badminton_session_token')
          setSessionToken('')
          setManageStep(1)
        }
        throw new Error(res.error || 'Failed to fetch subscriptions')
      }

      setUserSubscriptions(res.subscriptions || [])
      if (res.email) setUserEmail(res.email)
    } catch (err) {
      console.error('Error fetching user subscriptions:', err)
      setUserSubsError(err.message || 'Failed to fetch active subscriptions.')
    } finally {
      setFetchingUserSubs(false)
    }
  }

  // Auto-fetch subscriptions if sessionToken is present when management modal opens
  useEffect(() => {
    if (isManageModalOpen && sessionToken) {
      fetchUserSubscriptions(sessionToken)
    }
  }, [isManageModalOpen, sessionToken])

  // Step 1: Send OTP for Management Dashboard
  const handleSendManageCodeSubmit = async (e) => {
    e.preventDefault()
    if (!manageEmail) return

    setManageLoading(true)
    setManageError('')
    try {
      const response = await fetch('/api/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: manageEmail })
      })
      let res = {}
      try {
        res = await response.json()
      } catch {
        if (!response.ok) throw new Error('API server unreachable in local dev mode.')
      }
      if (!response.ok) throw new Error(res.error || 'Failed to send verification code')

      setManageStep(2)
      showToast('Verification code sent to your email!')
    } catch (err) {
      setManageError(err.message || 'Failed to send code.')
    } finally {
      setManageLoading(false)
    }
  }

  // Step 2: Verify OTP and save JWT session token
  const handleVerifyManageCodeSubmit = async (e) => {
    e.preventDefault()
    if (!manageEmail || !manageCode) return

    setManageLoading(true)
    setManageError('')
    try {
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: manageEmail, code: manageCode })
      })
      let res = {}
      try {
        res = await response.json()
      } catch {
        if (!response.ok) throw new Error('API server unreachable in local dev mode.')
      }
      if (!response.ok) throw new Error(res.error || 'Invalid verification code')

      if (res.session_token) {
        localStorage.setItem('badminton_session_token', res.session_token)
        setSessionToken(res.session_token)
        setUserEmail(res.email || manageEmail)
        showToast('Logged into Subscription Manager!')
        fetchUserSubscriptions(res.session_token)
      }
    } catch (err) {
      setManageError(err.message || 'Verification failed.')
    } finally {
      setManageLoading(false)
    }
  }

  // Delete a subscription rule
  const handleDeleteSubscription = async (subId) => {
    if (!window.confirm('Are you sure you want to delete this court alert subscription?')) return

    try {
      const response = await fetch('/api/user/subscriptions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ id: subId })
      })
      let res = {}
      try {
        res = await response.json()
      } catch {
        if (!response.ok) throw new Error('API server unreachable.')
      }
      if (!response.ok) throw new Error(res.error || 'Failed to delete subscription')

      setUserSubscriptions(prev => prev.filter(item => item.id !== subId))
      showToast('Subscription deleted successfully.')
    } catch (err) {
      setUserSubsError(err.message || 'Error deleting subscription.')
    }
  }

  // Start editing a subscription rule
  const handleStartEditSub = (sub) => {
    setEditingSub(sub)
    setEditLocations(sub.locations || [])
    setEditDays(sub.weekdays || [])
    setEditMinTime(sub.start_time_min || '00:00:00')
    setEditMaxTime(sub.start_time_max || '23:59:59')
    setUserSubsError('')
  }

  // Save edited subscription rule
  const handleSaveEditSubSubmit = async (e) => {
    e.preventDefault()
    if (!editingSub) return
    setUserSubsError('')

    if (editLocations.length === 0) {
      setUserSubsError('Please select at least one location.')
      return
    }
    if (editDays.length === 0) {
      setUserSubsError('Please select at least one weekday.')
      return
    }

    try {
      const response = await fetch('/api/user/subscriptions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          id: editingSub.id,
          locations: editLocations,
          weekdays: editDays,
          start_time_min: editMinTime,
          start_time_max: editMaxTime
        })
      })
      let res = {}
      try {
        res = await response.json()
      } catch {
        if (!response.ok) throw new Error('API server unreachable.')
      }
      if (!response.ok) throw new Error(res.error || 'Failed to update subscription')

      setUserSubscriptions(prev => prev.map(item => item.id === editingSub.id ? res.subscription : item))
      setEditingSub(null)
      showToast('Subscription criteria updated!')
    } catch (err) {
      setUserSubsError(err.message || 'Error updating subscription.')
    }
  }

  // Log Out from Subscription Manager
  const handleManageLogout = () => {
    localStorage.removeItem('badminton_session_token')
    setSessionToken('')
    setUserSubscriptions([])
    setUserEmail('')
    setManageStep(1)
    setManageEmail('')
    setManageCode('')
    showToast('Logged out of Subscription Manager.')
  }


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

  // Open new alert modal with all locations and days pre-selected by default
  const handleNewAlertClick = () => {
    setModalLocations(LOCATIONS.map(l => l.id))
    setModalDays(Object.values(WEEKDAY_FULL_NAMES))
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

    if (modalLocations.length === 0) {
      setVerificationError('Please select at least one location.')
      return
    }
    if (modalDays.length === 0) {
      setVerificationError('Please select at least one weekday.')
      return
    }

    setSendingCode(true)
    setVerificationError('')
    try {
      const response = await fetch('/api/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          locations: modalLocations,
          weekdays: modalDays,
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
        body: JSON.stringify({ token: unsubscribeToken })
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
  if (unsubscribeToken) {
    return (
      <div className="unsubscribe-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(11, 15, 25, 0.15), rgba(11, 15, 25, 0.45)), url("/bg-court.jpg") no-repeat 25% 90% fixed', backgroundSize: 'cover', padding: '20px' }}>
        <div className="unsubscribe-card glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '40px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', textAlign: 'center' }}>
          <ShuttlecockIcon className="brand-icon" size={48} style={{ margin: '0 auto 20px', color: 'var(--accent-neon)' }} />
          
          {!unsubscribeSuccess ? (
            <>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '15px' }}>Cancel Court Alerts</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', marginBottom: '25px' }}>
                Are you sure you want to stop receiving live badminton court availability alerts?
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
                You have been removed from all monitoring lists and will no longer receive alert emails.
              </p>
              <button 
                onClick={() => {
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
          <button 
            onClick={() => setIsManageModalOpen(true)} 
            className="manage-alerts-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', background: 'rgba(163, 230, 53, 0.12)', color: 'var(--accent-neon)', border: '1px solid rgba(163, 230, 53, 0.3)', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s ease' }}
          >
            <Sliders size={16} />
            <span>My Subscriptions</span>
          </button>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label className="form-label" style={{ marginBottom: 0 }}>Locations</label>
                          <button
                            type="button"
                            onClick={() => {
                              const allLocs = LOCATIONS.map(l => l.id)
                              if (modalLocations.length === allLocs.length) {
                                setModalLocations([])
                              } else {
                                setModalLocations(allLocs)
                              }
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-neon)', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                          >
                            {modalLocations.length === LOCATIONS.length ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label className="form-label" style={{ marginBottom: 0 }}>Weekdays</label>
                          <button
                            type="button"
                            onClick={() => {
                              const allDays = Object.values(WEEKDAY_FULL_NAMES)
                              if (modalDays.length === allDays.length) {
                                setModalDays([])
                              } else {
                                setModalDays(allDays)
                              }
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-neon)', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                          >
                            {modalDays.length === Object.values(WEEKDAY_FULL_NAMES).length ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
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


      {/* Personal Subscription Management Modal */}
      {isManageModalOpen && (
        <div className="modal-overlay" onClick={() => { setIsManageModalOpen(false); setEditingSub(null); }}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', width: '92%' }}>
            {!sessionToken ? (
              // Login / Verify OTP View for Manager
              <>
                {manageStep === 1 ? (
                  <>
                    <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sliders size={22} style={{ color: 'var(--accent-neon)' }} />
                      <span>Manage Your Subscriptions</span>
                    </h2>
                    <p className="modal-subtitle" style={{ marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                      Enter your registered email to receive a 6-digit login code. No password required.
                    </p>

                    <form onSubmit={handleSendManageCodeSubmit}>
                      <div className="form-group">
                        <label className="form-label">Registered Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. yourname@domain.com"
                          value={manageEmail}
                          onChange={(e) => setManageEmail(e.target.value)}
                          className="form-input"
                        />
                      </div>

                      {manageError && (
                        <div className="modal-error-box" style={{ color: '#ef4444', marginBottom: '15px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <AlertTriangle size={16} />
                          <span>{manageError}</span>
                        </div>
                      )}

                      <button type="submit" disabled={manageLoading} className="submit-btn">
                        {manageLoading ? 'Sending Login Code...' : 'Send Login Code'}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <h2 className="modal-title">🔐 Enter Login Code</h2>
                    <form onSubmit={handleVerifyManageCodeSubmit}>
                      <div className="form-group">
                        <label className="form-label" style={{ marginBottom: '8px' }}>
                          Enter the 6-digit verification code sent to:
                          <strong style={{ display: 'block', color: 'var(--text-primary)', marginTop: '4px' }}>{manageEmail}</strong>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="e.g. 123456"
                          value={manageCode}
                          onChange={(e) => setManageCode(e.target.value)}
                          className="form-input"
                          style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
                        />
                      </div>

                      {manageError && (
                        <div className="modal-error-box" style={{ color: '#ef4444', marginBottom: '15px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <AlertTriangle size={16} />
                          <span>{manageError}</span>
                        </div>
                      )}

                      <button type="submit" disabled={manageLoading} className="submit-btn" style={{ marginBottom: '15px' }}>
                        {manageLoading ? 'Verifying...' : 'Log In & Manage Alerts'}
                      </button>

                      <button 
                        type="button" 
                        onClick={() => setManageStep(1)} 
                        className="back-to-step1-btn"
                        style={{ background: 'none', border: 'none', color: 'var(--accent-neon)', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline', width: '100%', textAlign: 'center' }}
                      >
                        Use a different email address
                      </button>
                    </form>
                  </>
                )}
              </>
            ) : (
              // Active Subscriptions Dashboard View
              <>
                <div className="user-badge-bar">
                  <div className="user-badge-email">
                    <span className="user-badge-pulse"></span>
                    <ShieldCheck size={18} />
                    <span>{userEmail || 'Active Session'}</span>
                  </div>
                  <button onClick={handleManageLogout} className="btn-logout">
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </div>

                {userSubsError && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '12px 0 16px 0'
                  }}>
                    <AlertCircle size={16} />
                    <span>{userSubsError}</span>
                  </div>
                )}

                {addingNewRule ? (
                  // Add New Rule Form (Authenticated)
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Plus size={18} style={{ color: 'var(--accent-neon)' }} />
                      <span>Add New Alert Subscription Rule</span>
                    </h3>

                    <form onSubmit={handleCreateNewRuleSubmit}>
                      {/* Locations */}
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label className="form-label" style={{ marginBottom: 0 }}>Locations</label>
                          <button
                            type="button"
                            onClick={() => {
                              const allLocs = LOCATIONS.map(l => l.id)
                              if (newLocations.length === allLocs.length) {
                                setNewLocations([])
                              } else {
                                setNewLocations(allLocs)
                              }
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-neon)', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                          >
                            {newLocations.length === LOCATIONS.length ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        <div className="checkbox-grid">
                          {LOCATIONS.map(loc => (
                            <label key={loc.id} className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={newLocations.includes(loc.id)}
                                onChange={() => setNewLocations(prev => prev.includes(loc.id) ? prev.filter(i => i !== loc.id) : [...prev, loc.id])}
                              />
                              <span className="checkbox-custom">
                                {newLocations.includes(loc.id) && <CheckCircle size={14} />}
                              </span>
                              <span>{loc.id}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Weekdays */}
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label className="form-label" style={{ marginBottom: 0 }}>Weekdays</label>
                          <button
                            type="button"
                            onClick={() => {
                              const allDays = Object.values(WEEKDAY_FULL_NAMES)
                              if (newDays.length === allDays.length) {
                                setNewDays([])
                              } else {
                                setNewDays(allDays)
                              }
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-neon)', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                          >
                            {newDays.length === Object.values(WEEKDAY_FULL_NAMES).length ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        <div className="checkbox-grid">
                          {Object.keys(WEEKDAY_FULL_NAMES).map(dayAbbr => {
                            const fullName = WEEKDAY_FULL_NAMES[dayAbbr]
                            return (
                              <label key={dayAbbr} className="checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={newDays.includes(fullName)}
                                  onChange={() => setNewDays(prev => prev.includes(fullName) ? prev.filter(d => d !== fullName) : [...prev, fullName])}
                                />
                                <span className="checkbox-custom">
                                  {newDays.includes(fullName) && <CheckCircle size={14} />}
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
                          <CustomTimePicker
                            value={time24to12(newMinTime, '12:00 AM')}
                            onChange={(val) => setNewMinTime(time12to24(val, '00:00:00'))}
                            placeholder="Start Time"
                            options={TIME_OPTIONS}
                          />
                          <span style={{ color: 'var(--text-secondary)' }}>to</span>
                          <CustomTimePicker
                            value={time24to12(newMaxTime, '11:59 PM')}
                            onChange={(val) => setNewMaxTime(time12to24(val, '23:59:59'))}
                            placeholder="End Time"
                            options={TIME_OPTIONS}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button type="submit" className="submit-btn" style={{ flex: 1 }}>Save New Rule</button>
                        <button type="button" onClick={() => setAddingNewRule(false)} className="submit-btn" style={{ flex: 1, background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)' }}>Cancel</button>
                      </div>
                    </form>
                  </div>
                ) : editingSub ? (
                  // Edit Criteria Form
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Edit2 size={18} style={{ color: 'var(--accent-neon)' }} />
                      <span>Edit Subscription Criteria</span>
                    </h3>

                    <form onSubmit={handleSaveEditSubSubmit}>
                      {/* Locations */}
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label className="form-label" style={{ marginBottom: 0 }}>Locations</label>
                          <button
                            type="button"
                            onClick={() => {
                              const allLocs = LOCATIONS.map(l => l.id)
                              if (editLocations.length === allLocs.length) {
                                setEditLocations([])
                              } else {
                                setEditLocations(allLocs)
                              }
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-neon)', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                          >
                            {editLocations.length === LOCATIONS.length ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        <div className="checkbox-grid">
                          {LOCATIONS.map(loc => (
                            <label key={loc.id} className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={editLocations.includes(loc.id)}
                                onChange={() => setEditLocations(prev => prev.includes(loc.id) ? prev.filter(i => i !== loc.id) : [...prev, loc.id])}
                              />
                              <span className="checkbox-custom">
                                {editLocations.includes(loc.id) && <CheckCircle size={14} />}
                              </span>
                              <span>{loc.id}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Weekdays */}
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label className="form-label" style={{ marginBottom: 0 }}>Weekdays</label>
                          <button
                            type="button"
                            onClick={() => {
                              const allDays = Object.values(WEEKDAY_FULL_NAMES)
                              if (editDays.length === allDays.length) {
                                setEditDays([])
                              } else {
                                setEditDays(allDays)
                              }
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-neon)', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                          >
                            {editDays.length === Object.values(WEEKDAY_FULL_NAMES).length ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        <div className="checkbox-grid">
                          {Object.keys(WEEKDAY_FULL_NAMES).map(dayAbbr => {
                            const fullName = WEEKDAY_FULL_NAMES[dayAbbr]
                            return (
                              <label key={dayAbbr} className="checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={editDays.includes(fullName)}
                                  onChange={() => setEditDays(prev => prev.includes(fullName) ? prev.filter(d => d !== fullName) : [...prev, fullName])}
                                />
                                <span className="checkbox-custom">
                                  {editDays.includes(fullName) && <CheckCircle size={14} />}
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
                          <CustomTimePicker
                            value={time24to12(editMinTime, '12:00 AM')}
                            onChange={(val) => setEditMinTime(time12to24(val, '00:00:00'))}
                            placeholder="Start Time"
                            options={TIME_OPTIONS}
                          />
                          <span style={{ color: 'var(--text-secondary)' }}>to</span>
                          <CustomTimePicker
                            value={time24to12(editMaxTime, '11:59 PM')}
                            onChange={(val) => setEditMaxTime(time12to24(val, '23:59:59'))}
                            placeholder="End Time"
                            options={TIME_OPTIONS}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button type="submit" className="submit-btn" style={{ flex: 1 }}>Save Changes</button>
                        <button type="button" onClick={() => setEditingSub(null)} className="submit-btn" style={{ flex: 1, background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)' }}>Cancel</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  // List Active Subscriptions
                  <div className="sub-management-container">
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>Active Alert Rules ({userSubscriptions.length})</span>
                      <button onClick={() => fetchUserSubscriptions(sessionToken)} className="refresh-btn" title="Refresh rules">
                        <RefreshCw size={14} className={fetchingUserSubs ? "spinner" : ""} />
                      </button>
                    </h3>

                    {fetchingUserSubs ? (
                      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>Loading active subscriptions...</p>
                    ) : userSubscriptions.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px 20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                        <Bell size={36} style={{ color: 'var(--text-secondary)', margin: '0 auto 10px', opacity: 0.5 }} />
                        <p style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}>No Active Alert Subscriptions</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>You haven't set up any active court alerts for this email yet.</p>
                      </div>
                    ) : (
                      userSubscriptions.map((sub, idx) => (
                        <div key={sub.id} className="sub-card">
                          <div className="sub-card-header">
                            <div className="sub-card-title">
                              <Bell size={16} style={{ color: 'var(--accent-neon)' }} />
                              <span>Rule #{idx + 1}</span>
                            </div>
                            <span className="sub-card-badge">
                              Created {new Date(sub.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="sub-chip-group">
                            {/* Locations */}
                            {(sub.locations || []).map(loc => (
                              <span key={loc} className="sub-chip location">
                                <MapPin size={13} />
                                <span>{loc}</span>
                              </span>
                            ))}

                            {/* Weekdays */}
                            {(sub.weekdays || []).map(day => (
                              <span key={day} className="sub-chip weekday">
                                <Calendar size={13} />
                                <span>{day.slice(0, 3)}</span>
                              </span>
                            ))}

                            {/* Time range */}
                            <span className="sub-chip time">
                              <Clock size={13} />
                              <span>{sub.start_time_min === '00:00:00' && sub.start_time_max === '23:59:59' ? 'Any Time' : `${sub.start_time_min.slice(0, 5)} - ${sub.start_time_max.slice(0, 5)}`}</span>
                            </span>
                          </div>

                          <div className="sub-actions">
                            <button onClick={() => handleStartEditSub(sub)} className="btn-sub-action edit">
                              <Edit2 size={13} />
                              <span>Edit</span>
                            </button>
                            <button onClick={() => handleDeleteSubscription(sub.id)} className="btn-sub-action delete">
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}

                    <button 
                      onClick={handleStartAddNewRule} 
                      className="add-alert-rule-btn"
                    >
                      <Plus size={16} />
                      <span>Create New Alert Subscription Rule</span>
                    </button>
                  </div>
                )}
              </>
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

      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  )
}

export default App
