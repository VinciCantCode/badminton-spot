import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'
import {
  Activity,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Bell,
  X,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'
import './App.css'

// Hardcoded locations for checkboxes in filter and modal
const LOCATIONS = [
  { id: 'Delbrook', name: 'Delbrook Community Centre' },
  { id: 'Parkgate', name: 'Parkgate Community Centre' },
  { id: 'Lions Gate', name: 'Lions Gate Community Centre' },
  { id: 'John Braithwaite', name: 'John Braithwaite (JBCC)' },
  { id: 'Lynn Creek', name: 'Lynn Creek Recreation Centre' }
]

// Weekdays mapping
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function App() {
  // State
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filtering States
  const [selectedLocations, setSelectedLocations] = useState([])
  const [selectedDays, setSelectedDays] = useState([])
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

  // Location filter toggle
  const toggleLocationFilter = (locId) => {
    setSelectedLocations(prev =>
      prev.includes(locId) ? prev.filter(id => id !== locId) : [...prev, locId]
    )
  }

  // Weekday filter toggle
  const toggleDayFilter = (dayName) => {
    setSelectedDays(prev =>
      prev.includes(dayName) ? prev.filter(d => d !== dayName) : [...prev, dayName]
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
    // 1. Availability filter
    if (showAvailableOnly && slot.spots_count === 0) {
      return false
    }

    // 2. Location filter
    if (selectedLocations.length > 0) {
      const matchesLoc = selectedLocations.some(locId =>
        slot.location_name.toLowerCase().includes(locId.toLowerCase())
      )
      if (!matchesLoc) return false
    }

    // 3. Day filter
    if (selectedDays.length > 0) {
      const slotDay = getWeekdayFromDateDesc(slot.date_desc)
      if (!selectedDays.includes(slotDay)) return false
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
      const hours = String(dateObj.getHours()).padStart(2, '0')
      const minutes = String(dateObj.getMinutes()).padStart(2, '0')
      
      // We set range around the slot time (e.g. from 1 hour before to 1 hour after)
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
        weekdays: modalDays.length > 0 ? modalDays : WEEKDAYS,
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
      <header className="app-header glass-panel">
        <div className="brand-section">
          <Activity className="brand-icon" size={32} />
          <h1 className="brand-title">BadmintonSpot</h1>
        </div>
        <div className="sync-status">
          <span className="status-dot"></span>
          <span>Live Sync Active</span>
          <button 
            onClick={fetchSlots} 
            className="close-btn" 
            style={{ position: 'relative', top: 0, right: 0, padding: '2px' }}
            title="Refresh availability"
          >
            <RefreshCw size={14} className={loading ? "spinner" : ""} />
          </button>
        </div>
      </header>

      {/* Filters Bar */}
      <section className="filters-bar glass-panel">
        {/* Locations */}
        <div className="filter-group">
          <span className="filter-label">Locations</span>
          <div className="filter-pills">
            {LOCATIONS.map(loc => (
              <button
                key={loc.id}
                onClick={() => toggleLocationFilter(loc.id)}
                className={`filter-pill ${selectedLocations.includes(loc.id) ? 'active' : ''}`}
              >
                {loc.id}
              </button>
            ))}
          </div>
        </div>

        {/* Days of Week */}
        <div className="filter-group">
          <span className="filter-label">Weekdays</span>
          <div className="filter-pills">
            {WEEKDAYS.map(day => (
              <button
                key={day}
                onClick={() => toggleDayFilter(day)}
                className={`filter-pill ${selectedDays.includes(day) ? 'active' : ''}`}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle & Action */}
        <div className="filter-controls-row">
          <div 
            className={`toggle-container ${showAvailableOnly ? 'active' : ''}`}
            onClick={() => setShowAvailableOnly(!showAvailableOnly)}
          >
            <div className="toggle-switch"></div>
            <span className="toggle-label">Show Available Only</span>
          </div>

          <button onClick={handleNewAlertClick} className="subscribe-btn-main">
            <Bell size={18} />
            <span>Create Custom Alert</span>
          </button>
        </div>
      </section>

      {/* Main Grid View */}
      <main>
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
              const formattedTime = slot.date_desc
              const timeRange = slot.time_desc || ''

              return (
                <div key={slot.event_id} className="slot-card glass-panel">
                  <div className="slot-header">
                    <span className="location-tag">{slot.location_name.split(' ')[0]}</span>
                    <span className={`status-badge ${isFull ? 'full' : 'available'}`}>
                      {isFull ? 'Full' : `${slot.spots_count} spots`}
                    </span>
                  </div>

                  <h3 className="slot-title">{slot.event_name}</h3>

                  <div className="slot-details">
                    <div className="detail-item">
                      <Calendar size={14} className="detail-icon" />
                      <span>{formattedTime}</span>
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
      </main>

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
                      {WEEKDAYS.map(day => (
                        <label key={day} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={modalDays.includes(day)}
                            onChange={() => handleModalDayToggle(day)}
                          />
                          <span className="checkbox-custom">
                            {modalDays.includes(day) && <CheckCircle size={14} />}
                          </span>
                          <span>{day.substring(0, 3)}</span>
                        </label>
                      ))}
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
