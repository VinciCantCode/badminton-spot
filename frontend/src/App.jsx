import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'
import {
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Bell,
  X,
  CheckCircle,
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

function App() {
  // State
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filtering States
  const [selectedLocation, setSelectedLocation] = useState('All Locations')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedDays, setSelectedDays] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [modalLocations, setModalLocations] = useState([])
  const [modalDays, setModalDays] = useState([])
  const [startTimeMin, setStartTimeMin] = useState('00:00:00')
  const [startTimeMax, setStartTimeMax] = useState('23:59:59')
  const [submitting, setSubmitting] = useState(false)
  const [subscribeSuccess, setSubscribeSuccess] = useState(false)

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

  // Filter slots
  const filteredSlots = slots.filter(slot => {
    // 1. Availability filter (if checked, hide full slots)
    if (showAvailableOnly && slot.spots_count === 0) {
      return false
    }

    // 2. Location filter
    if (selectedLocation !== 'All Locations') {
      if (!slot.location_name.toLowerCase().includes(selectedLocation.toLowerCase())) {
        return false
      }
    }

    // 3. Date filter
    if (selectedDate) {
      try {
        const slotDate = new Date(slot.start_time).toISOString().split('T')[0]
        if (slotDate !== selectedDate) return false
      } catch {
        return false
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
    setIsModalOpen(true)
  }

  // Open empty modal
  const handleNewAlertClick = () => {
    setModalLocations([])
    setModalDays([])
    setStartTimeMin('00:00:00')
    setStartTimeMax('23:59:59')
    setSubscribeSuccess(false)
    setIsModalOpen(true)
  }

  // Submit Alert Subscription
  const handleSubscribeSubmit = async (e) => {
    e.preventDefault()
    if (!email) return

    setSubmitting(true)
    try {
      const { error } = await supabase.from('subscriptions').insert({
        email,
        locations: modalLocations.length > 0 ? modalLocations : LOCATIONS.map(l => l.id),
        weekdays: modalDays.length > 0 ? modalDays : Object.values(WEEKDAY_FULL_NAMES),
        start_time_min: startTimeMin,
        start_time_max: startTimeMax,
        is_active: true
      })

      if (error) throw error

      setSubscribeSuccess(true)
      showToast('Subscription created successfully!')
    } catch (err) {
      console.error('Error creating subscription:', err)
      showToast('Failed to create subscription. Please try again.')
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

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <ShuttlecockIcon className="brand-icon" size={32} />
          <div>
            <h1 className="brand-title">BadmintonSpot</h1>
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
              <div className="select-wrapper">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="dropdown-select"
                >
                  <option value="All Locations">All Locations</option>
                  {LOCATIONS.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.id}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="dropdown-arrow" />
              </div>
            </div>

            {/* Date Picker */}
            <div className="horizontal-filter-item">
              <span className="horizontal-filter-label">Date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-input"
              />
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
                  const timeRange = slot.time_desc || ''

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
                            href="https://nvrc.perfectmind.com/23734/Clients/BookMe4BookingPages/BookingCoursesPage?calendarId=107644e1-183f-4052-a809-52e13ec76293&widgetId=a28b2c65-61af-407f-80d1-eaa58f30a94a&embed=False" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="action-btn book"
                            style={{ textDecoration: 'none' }}
                          >
                            <span>Book Now</span>
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
                <h2 className="modal-title">🔔 Create Court Alert</h2>
                <form onSubmit={handleSubscribeSubmit}>
                  {/* Email */}
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. zenith.peak77@gmail.com"
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

                  <button type="submit" disabled={submitting} className="submit-btn">
                    {submitting ? 'Creating alert...' : 'Confirm Subscription'}
                  </button>
                </form>
              </>
            ) : (
              <div className="success-state">
                <CheckCircle className="success-icon" size={64} />
                <h2 className="modal-title" style={{ marginBottom: '8px' }}>Subscription Successful!</h2>
                <p className="success-desc">
                  We are now monitoring these court times for you. As soon as a court slot matches your criteria and someone cancels, we'll email you at:
                  <br />
                  <strong style={{ color: 'var(--accent-neon)', display: 'block', marginTop: '8px' }}>{email}</strong>
                </p>
                <button onClick={() => setIsModalOpen(false)} className="submit-btn" style={{ marginTop: '20px' }}>
                  Great, Thanks!
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
