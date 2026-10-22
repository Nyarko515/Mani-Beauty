'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useSearchParams } from '../../src/router'
import { useForm } from 'react-hook-form'
import { Calendar, Clock, User, Mail, Phone, MessageSquare, CheckCircle, Loader, ChevronDown, Upload } from 'lucide-react'
import ModalNotification from '../components/ModalNotification'
import fallbackCatalog from '../../data/catalog.json'
import styles from '../styles/booking.module.css'
import { apiFetch } from '../../lib/api-client'

const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const buildServiceGroups = (services) =>
  (services || []).map((group) => ({
    label: group.category,
    options: (group.items || []).map((item) => ({
      value: slugify(item.name),
      label: `${item.name} - ${Array.isArray(item.price) ? item.price[0] : item.price}`,
      name: item.name,
      price: item.price,
    })),
  }))

function CustomSelect({ label, options, value, onChange, placeholder, iconColor, icon: Icon, groupedOptions, error }) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState('below')
  const containerRef = useRef(null)

  const nativeOptions = groupedOptions
    ? groupedOptions.flatMap((group) => group.options)
    : (options || [])

  const getDisplayLabel = () => {
    if (groupedOptions) {
      for (const group of groupedOptions) {
        const found = group.options.find((opt) => opt.value === value)
        if (found) return found.label
      }
    } else {
      const found = options?.find((opt) => opt.value === value)
      if (found) return found.label
    }

    return placeholder
  }

  const handleOpen = () => {
    setIsOpen(!isOpen)

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setDropdownPosition(spaceBelow < 300 ? 'above' : 'below')
    }
  }

  const handlePick = (nextValue) => {
    onChange(nextValue)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={`form-group ${styles.customSelectWrap}`}>
      <label>
        <Icon size={18} className={`${styles.labelIcon} ${iconColor}`} />
        {label}
      </label>

      <select
        value={value}
        onChange={(event) => handlePick(event.target.value)}
        className={styles.nativeSelect}
        aria-label={label}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {groupedOptions
          ? groupedOptions.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))
          : nativeOptions.map((option) => (
              <option key={option.value || option} value={option.value || option}>
                {option.label || option}
              </option>
            ))}
      </select>

      <div className={styles.selectOuter} aria-hidden="true">
        <div className={styles.selectTrigger}>
          <span className={`${styles.selectValue} ${value ? styles.selectValueFilled : styles.selectValuePlaceholder}`}>
            {getDisplayLabel()}
          </span>
          <ChevronDown size={20} className={styles.chevronIcon} />
        </div>
      </div>

      {error && <p className="form-error">{error.message}</p>}
    </div>
  )
}

function CustomCalendar({ value, onChange, minDate }) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => {
    if (value) {
      return new Date(value + 'T00:00:00')
    }

    return new Date()
  })

  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const allDays = []
  
  for (let i = 1; i <= daysInMonth(month); i += 1) {
    allDays.push(i)
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const handleDateClick = (day) => {
    const year = month.getFullYear()
    const monthNum = month.getMonth() + 1
    const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    onChange(dateStr)
    setOpen(false)
  }

  const previousMonth = () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() - 1))
  }

  const nextMonth = () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + 1))
  }

  const isDateDisabled = (day) => {
    const selectedDate = new Date(month.getFullYear(), month.getMonth(), day)
    const minDateObj = new Date(minDate + 'T00:00:00')
    return selectedDate < minDateObj
  }

  const selectedDate = value ? new Date(value + 'T00:00:00') : null

  const isCurrentMonth = (day) => {
    if (!day) return false
    const checkDate = new Date(month.getFullYear(), month.getMonth(), day)
    return checkDate.toDateString() === selectedDate?.toDateString()
  }

  const openCalendar = () => {
    setOpen(true)
    if (value) {
      setMonth(new Date(value + 'T00:00:00'))
    }
  }

  return (
    <div className={styles.calendarWrap}>
      <input
        type="text"
        value={value ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
        readOnly
        onClick={openCalendar}
        placeholder="Select a date"
        className={`${styles.calendarInput} ${open || value ? styles.calendarInputActive : ''}`}
      />

      <button type="button" onClick={openCalendar} className={`${styles.calendarIconButton} ${open || value ? styles.calendarIconButtonActive : ''}`}>
        <Calendar size={20} />
      </button>

      {open && (
        <div className={styles.calendarDropdown} onClick={(e) => e.stopPropagation()}>
          <div className={styles.calendarHeader}>
            <button type="button" onClick={previousMonth} className={styles.monthNavButton}>
              ←
            </button>
            <div className={styles.monthTitle}>
              {monthNames[month.getMonth()]} {month.getFullYear()}
            </div>
            <button type="button" onClick={nextMonth} className={styles.monthNavButton}>
              →
            </button>
          </div>

          <div className={styles.dayNamesGrid}>
            {dayNames.map((day) => (
              <div key={day} className={styles.dayNameCell}>
                {day}
              </div>
            ))}
          </div>

          <div className={styles.daysGrid} style={{ gridTemplateColumns: `repeat(7, 1fr)` }}>
            {Array(firstDayOfMonth(month)).fill(null).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {allDays.map((day) => {
              const disabled = isDateDisabled(day)
              const selected = isCurrentMonth(day)
              
              return (
                <button
                  type="button"
                  key={`day-${day}`}
                  onClick={() => {
                    if (!disabled) {
                      handleDateClick(day)
                    }
                  }}
                  disabled={disabled}
                  className={`${styles.dayButton} ${disabled ? styles.dayButtonDisabled : ''} ${selected ? styles.dayButtonSelected : ''}`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <button type="button" onClick={() => setOpen(false)} className={styles.doneButton}>
            Done
          </button>
        </div>
      )}

      {open && <div className={styles.calendarBackdrop} onClick={() => setOpen(false)} />}
    </div>
  )
}

function CustomDateInput({ label, value, onChange, minDate, iconColor, icon: Icon, error }) {
  return (
    <div className={`form-group ${styles.customDateGroup}`}>
      <label>
        <Icon size={18} className={`${iconColor} ${styles.dateLabelIcon}`} />
        {label}
      </label>
      <CustomCalendar value={value} onChange={onChange} minDate={minDate} />
      {error && <p className="form-error">{error.message}</p>}
    </div>
  )
}

async function optimizeReferenceImage(file) {
  const MAX_DIMENSION = 1400
  const TARGET_SIZE = 750 * 1024

  if (file.size <= TARGET_SIZE) return file

  let imageSource
  let width
  let height
  let cleanup = () => {}

  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      imageSource = bitmap
      width = bitmap.width
      height = bitmap.height
      cleanup = () => bitmap.close?.()
    } catch {
      // Safari and some mobile browsers need the HTML image fallback below.
    }
  }

  if (!imageSource) {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.decoding = 'async'

    try {
      await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = reject
        image.src = objectUrl
      })
      imageSource = image
      width = image.naturalWidth
      height = image.naturalHeight
      cleanup = () => URL.revokeObjectURL(objectUrl)
    } catch {
      URL.revokeObjectURL(objectUrl)
      throw new Error('This reference photo could not be prepared. Please use a JPG, PNG, or WEBP image.')
    }
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const context = canvas.getContext('2d')

  if (!context) {
    cleanup()
    throw new Error('This reference photo could not be prepared. Please choose another image.')
  }

  context.drawImage(imageSource, 0, 0, canvas.width, canvas.height)
  cleanup()

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.75))
  if (!blob) throw new Error('This reference photo could not be prepared. Please choose another image.')

  const baseName = String(file.name || 'reference-photo').replace(/\.[^.]+$/, '')
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
}

async function uploadReferenceImage(file) {
  const preparedFile = await optimizeReferenceImage(file)
  const formData = new FormData()
  formData.append('file', preparedFile)

  let response
  try {
    response = await apiFetch('/api/uploads', {
      method: 'POST',
      body: formData,
    })
  } catch {
    throw new Error('The reference photo upload could not connect. Please check your connection and try again.')
  }

  if (!response.ok) {
    let message = 'Failed to upload reference image'

    try {
      const payload = await response.json()
      message = payload?.details || payload?.error || message
    } catch {
      // Use the default message when the response body is not JSON.
    }

    throw new Error(message)
  }

  const payload = await response.json()
  return payload.url
}

export default function BookingPage() {
  const searchParams = useSearchParams()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm()

  const formRef = useRef(null)
  const serviceFieldRef = useRef(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [serviceValue, setServiceValue] = useState('')
  const [ignoreRequestedService, setIgnoreRequestedService] = useState(false)
  const [timeValue, setTimeValue] = useState('')
  const [dateValue, setDateValue] = useState('')
  const [bookingReference, setBookingReference] = useState('')
  const [bookingActions, setBookingActions] = useState(null)
  const [bookingNotice, setBookingNotice] = useState('')
  const [serviceGroups, setServiceGroups] = useState(() => buildServiceGroups(fallbackCatalog.services))
  const [customFieldErrors, setCustomFieldErrors] = useState({ service: '', date: '', time: '' })
  const [referenceImage, setReferenceImage] = useState(null)
  const [referenceImageName, setReferenceImageName] = useState('')
  const [referenceImageError, setReferenceImageError] = useState('')
  const [bookingPaymentAmount, setBookingPaymentAmount] = useState(0)
  const [bookingCustomerName, setBookingCustomerName] = useState('')
  const [bookingCustomerEmail, setBookingCustomerEmail] = useState('')
  const [isStartingPayment, setIsStartingPayment] = useState(false)

  const getStartingPrice = (price) => {
    const firstPrice = Array.isArray(price) ? price[0] : price
    const match = String(firstPrice || '').replace(/,/g, '').match(/([0-9]+(?:\.[0-9]{1,2})?)/)
    return match ? Number(match[1]) : 0
  }

  const specialRequestActive = searchParams.get('specialRequest') === '1'
  const specialRequestCategory = searchParams.get('category') || ''
  const specialRequestServiceLabel = specialRequestCategory
    ? `Custom request - ${specialRequestCategory}`
    : 'Custom request'
  const notesLabel = specialRequestActive ? 'Custom Request Details (Optional)' : 'Additional Notes (Optional)'
  const notesPlaceholder = specialRequestActive
    ? 'Describe the braid look you want, your preferred size, length, color, or any other details.'
    : 'Any special requests or requirements?'

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const response = await apiFetch('/api/catalog')
        if (!response.ok) {
          throw new Error('Failed to load service catalog')
        }

        const catalog = await response.json()
        const nextGroups = buildServiceGroups(catalog.services)
        if (nextGroups.length > 0) {
          setServiceGroups(nextGroups)
        }
      } catch {
        setServiceGroups(buildServiceGroups(fallbackCatalog.services))
      }
    }

    loadCatalog()
  }, [])

  const validateCustomFields = () => {
    // If user uploaded a custom image, service selection is optional
    const serviceRequired = !referenceImage
    
    const nextErrors = {
      service: serviceRequired && !serviceValue ? 'Please select a service' : '',
      date: dateValue ? '' : 'Please select a date',
      time: timeValue ? '' : 'Please select a time',
    }

    setCustomFieldErrors(nextErrors)
    
    // If there are validation errors, scroll to the service field on mobile
    if (nextErrors.service && serviceFieldRef.current) {
      setTimeout(() => {
        serviceFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
    
    return !nextErrors.service && !nextErrors.date && !nextErrors.time
  }

  const onSubmit = async (data) => {
    if (!validateCustomFields()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    setReferenceImageError('')

    try {
      const selectedService = allServiceOptions.find((option) => option.value === serviceValue)
      let referenceImageUrl = ''

      if (referenceImage) {
        referenceImageUrl = await uploadReferenceImage(referenceImage)
      }

      const notes = String(data.notes || '').trim()
      const bookingNotes = [notes, referenceImageUrl ? `Reference image: ${referenceImageUrl}` : '']
        .filter(Boolean)
        .join('\n\n')

      // If user uploaded a custom image without selecting a service, treat as special request
      const isCustomImageRequest = referenceImage && !serviceValue
      const finalSpecialRequest = specialRequestActive || isCustomImageRequest

      const response = await apiFetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          specialRequest: finalSpecialRequest,
          category: specialRequestCategory,
          service: finalSpecialRequest ? 'special-request' : serviceValue,
          serviceLabel: finalSpecialRequest
            ? specialRequestServiceLabel || 'Custom request with reference photo'
            : (selectedService?.name || selectedService?.label || serviceValue),
          date: dateValue,
          time: timeValue,
          notes: bookingNotes,
        }),
      })

      if (!response.ok) {
        let message = 'Booking request failed'
        try {
          const payload = await response.json()
          message = payload?.details || payload?.error || message
        } catch {
          // Keep the default message when the server does not return JSON.
        }
        throw new Error(message)
      }

      const result = await response.json()

      setIsSuccess(true)
      setBookingReference(result.booking?.id || '')
      setBookingActions(result.actions || null)
      setBookingNotice(result.notice || '')
      setBookingCustomerName(data.name || '')
      setBookingCustomerEmail(data.email || '')
      setBookingPaymentAmount(finalSpecialRequest ? 0 : Number(getStartingPrice(selectedService?.price).toFixed(2)))
      reset()
      setServiceValue('')
      setDateValue('')
      setTimeValue('')
      setReferenceImage(null)
      setReferenceImageName('')
      setCustomFieldErrors({ service: '', date: '', time: '' })
      // NO auto-close - user closes modal manually
    } catch (error) {
      if (error instanceof Error && /upload|photo|image/i.test(error.message)) {
        setReferenceImageError(error.message)
      } else {
        setSubmitError(error instanceof Error ? error.message : 'We could not save your booking right now. Please try again in a moment.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBookingPayment = async () => {
    setSubmitError('')
    setIsStartingPayment(true)

    try {
      const reference = `booking-${bookingReference}-${Date.now()}`
      const response = await apiFetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'booking', orderId: bookingReference, reference }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.data?.authorizationUrl) {
        throw new Error(payload.error || 'Could not start Paystack payment')
      }
      window.location.assign(payload.data.authorizationUrl)
    } catch (error) {
      setSubmitError(error.message || 'Could not start Paystack payment')
      setIsSuccess(false)
      setIsStartingPayment(false)
    }
  }

  const handleReferenceImageChange = (event) => {
    const file = event.target.files?.[0] || null

    if (!file) {
      setReferenceImage(null)
      setReferenceImageName('')
      setReferenceImageError('')
      return
    }

    const allowedTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
    const maxSize = 20 * 1024 * 1024

    if (!allowedTypes.has(file.type)) {
      setReferenceImage(null)
      setReferenceImageName('')
      setReferenceImageError('Please choose a JPG, PNG, or WEBP image.')
      return
    }

    if (file.size <= 0 || file.size > maxSize) {
      setReferenceImage(null)
      setReferenceImageName('')
      setReferenceImageError('Reference images must be between 1 byte and 20MB.')
      return
    }

    setReferenceImage(file)
    setReferenceImageName(file.name)
    setReferenceImageError('')
  }

  const timeSlots = [
    '9:00 AM',
    '9:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '12:00 PM',
    '12:30 PM',
    '1:00 PM',
    '1:30 PM',
    '2:00 PM',
    '2:30 PM',
    '3:00 PM',
    '3:30 PM',
    '4:00 PM',
    '4:30 PM',
    '5:00 PM',
    '5:30 PM',
    '6:00 PM',
  ]
  const sundayTimeSlots = timeSlots.slice(timeSlots.indexOf('1:00 PM'))
  const availableTimeSlots = dateValue && new Date(`${dateValue}T00:00:00`).getDay() === 0
    ? sundayTimeSlots
    : timeSlots

  const allServiceOptions = useMemo(
    () => serviceGroups.flatMap((group) => group.options),
    [serviceGroups]
  )

  useEffect(() => {
    if (specialRequestActive || ignoreRequestedService) {
      return
    }

    const requestedService = searchParams.get('service')
    if (!requestedService || serviceValue || allServiceOptions.length === 0) {
      return
    }

    const normalize = (text) =>
      String(text || '')
        .toLowerCase()
        .replace(/[()]/g, '')
        .replace(/\s*-\s*from\s+ghs.*$/i, '')
        .replace(/[^a-z0-9]+/g, '')

    const requestedKey = normalize(requestedService)

    const exactMatch = allServiceOptions.find(
      (option) => option.value === requestedService || normalize(option.value) === requestedKey
    )

    const labelMatch =
      exactMatch ||
      allServiceOptions.find((option) => {
        const optionLabelKey = normalize(option.label)
        return optionLabelKey === requestedKey || optionLabelKey.includes(requestedKey) || requestedKey.includes(optionLabelKey)
      })

    if (labelMatch) {
      setServiceValue(labelMatch.value)
      setCustomFieldErrors((prev) => ({ ...prev, service: '' }))
    }
  }, [allServiceOptions, searchParams, serviceValue, specialRequestActive, ignoreRequestedService])

  return (
    <>
      <section className={styles.hero}>
        <div className="container text-center">
          <h1 className={styles.heroTitle}>
            <span className="text-gradient-orange">Book</span> Your Appointment
          </h1>
          <p className={styles.heroText}>Schedule your beauty appointment in just a few clicks. We'll confirm your booking shortly.</p>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className="container">
          <div className={styles.formWrap}>
            {submitError && (
              <div className={styles.errorMessage}>
                <p className={styles.errorTitle}>Booking not saved</p>
                <p className={styles.errorText}>{submitError}</p>
              </div>
            )}

            <div className={`card ${styles.bookingCard}`}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className={`grid grid-2 ${styles.formGrid}`}>
                  <div className="form-group">
                    <label htmlFor="name">
                      <User size={18} className={`${styles.labelIcon} ${styles.iconGreen}`} />
                      Full Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      {...register('name', {
                        required: 'Name is required',
                        minLength: { value: 2, message: 'Name must be at least 2 characters' },
                      })}
                    />
                    {errors.name && <p className="form-error">{errors.name.message}</p>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">
                      <Mail size={18} className={`${styles.labelIcon} ${styles.iconPink}`} />
                      Email Address *
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      {...register('email', {
                        required: 'Email address is required for payment',
                        validate: (value) => {
                          if (!value) return true
                          return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value) || 'Invalid email address'
                        },
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                    />
                    {errors.email && <p className="form-error">{errors.email.message}</p>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">
                      <Phone size={18} className={`${styles.labelIcon} ${styles.iconGreen}`} />
                      Phone Number * <span style={{ fontSize: '0.85rem', color: 'var(--color-grey)' }}>(Start with +233)</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="e.g. +233 50 000 9547"
                      {...register('phone', {
                        required: 'Phone number is required',
                        pattern: {
                          value: /^[\d\s\-\(\)\+]+$/,
                          message: 'Invalid phone number',
                        },
                      })}
                    />
                    {errors.phone && <p className="form-error">{errors.phone.message}</p>}
                  </div>

                  <div ref={serviceFieldRef}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <CustomSelect
                          label="Select Service *"
                          value={serviceValue}
                          onChange={(val) => {
                            setIgnoreRequestedService(false)
                            setServiceValue(val)
                            if (customFieldErrors.service) {
                              setCustomFieldErrors((prev) => ({ ...prev, service: '' }))
                            }
                          }}
                          placeholder="Select a Service"
                          iconColor={styles.iconGreen}
                          icon={Calendar}
                          groupedOptions={serviceGroups}
                          error={customFieldErrors.service ? { message: customFieldErrors.service } : null}
                        />
                      </div>
                      {serviceValue && (
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setIgnoreRequestedService(true)
                            setServiceValue('')
                            setCustomFieldErrors((prev) => ({ ...prev, service: '' }))
                          }}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: '#f0f0f0',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            color: '#666',
                            whiteSpace: 'nowrap',
                            marginBottom: 0,
                            fontWeight: 500,
                          }}
                          title="Clear the selected service and use a reference photo instead"
                        >
                          Clear Service
                        </button>
                      )}
                    </div>
                  </div>

                  <CustomDateInput
                    label="Preferred Date *"
                    value={dateValue}
                    onChange={(val) => {
                      setDateValue(val)
                      if (
                        new Date(`${val}T00:00:00`).getDay() === 0 &&
                        timeValue &&
                        timeSlots.indexOf(timeValue) < timeSlots.indexOf('1:00 PM')
                      ) {
                        setTimeValue('')
                      }
                      if (customFieldErrors.date) {
                        setCustomFieldErrors((prev) => ({ ...prev, date: '' }))
                      }
                    }}
                    minDate={new Date().toISOString().split('T')[0]}
                    iconColor={styles.iconPink}
                    icon={Calendar}
                    error={customFieldErrors.date ? { message: customFieldErrors.date } : null}
                  />

                  <CustomSelect
                    label="Preferred Time *"
                    value={timeValue}
                    onChange={(val) => {
                      setTimeValue(val)
                      if (customFieldErrors.time) {
                        setCustomFieldErrors((prev) => ({ ...prev, time: '' }))
                      }
                    }}
                    placeholder="Select a Time"
                    iconColor={styles.iconOrange}
                    icon={Clock}
                    options={availableTimeSlots.map((slot) => ({ value: slot, label: slot }))}
                    error={customFieldErrors.time ? { message: customFieldErrors.time } : null}
                  />
                </div>

                <div className={styles.specialRequestCard}>
                  <div className={styles.specialRequestHeader}>
                    <div className={styles.specialRequestIconWrap}>
                      <Upload size={20} className={styles.specialRequestIcon} />
                    </div>
                    <div>
                      <h3 className={styles.specialRequestTitle}>
                        {specialRequestActive ? 'Custom braid request' : 'Reference photo upload'}
                      </h3>
                      <p className={styles.specialRequestText}>
                        If you do not see the exact braid style you want, upload a reference photo so we can review the look with you.
                      </p>
                    </div>
                  </div>

                  <div className={`form-group ${styles.uploadGroup}`}>
                    <label htmlFor="referenceImage">
                      <Upload size={18} className={`${styles.labelIcon} ${styles.iconOrange}`} />
                      Reference Photo (Optional)
                    </label>
                    <input
                      id="referenceImage"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleReferenceImageChange}
                    />
                    <p className={styles.uploadHint}>
                      Share a braid photo that matches the style you want. We will add the image to your request notes.
                    </p>
                    {referenceImageName && <p className={styles.uploadFileName}>Selected file: {referenceImageName}</p>}
                    {referenceImageError && <p className="form-error">{referenceImageError}</p>}
                  </div>
                </div>

                <div className={`form-group ${styles.notesGroup}`}>
                  <label htmlFor="notes">
                    <MessageSquare size={18} className={`${styles.labelIcon} ${styles.iconGreen}`} />
                    {notesLabel}
                  </label>
                  <textarea id="notes" rows="4" placeholder={notesPlaceholder} {...register('notes')} />
                </div>

                <button type="submit" disabled={isSubmitting} className={`btn btn-primary ${styles.submitButton} ${isSubmitting ? styles.submitButtonDisabled : ''}`}>
                  {isSubmitting ? (
                    <>
                      <Loader className="loading" size={20} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Calendar size={20} />
                      Book Appointment
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className={`grid grid-3 ${styles.infoGrid}`}>
              <div className={`${styles.infoCard} ${styles.infoCardPink}`}>
                <div className={styles.infoEmoji}>📞</div>
                <h3 className={styles.infoTitle}>Call Us</h3>
                <p className={styles.infoText}>
                  <a href="tel:+233558812020" className={styles.infoLink}>055-881-2020</a>
                  <br />
                  <a href="tel:+233558812020" className={styles.infoLink}>055-881-2020</a>
                  <br />
                  <a href="tel:+233536591889" className={styles.infoLink}>053-659-1889</a>
                </p>
              </div>

              <div className={`${styles.infoCard} ${styles.infoCardOrange}`}>
                <div className={styles.infoEmoji}>✉️</div>
                <h3 className={styles.infoTitle}>Email Us</h3>
                <p className={styles.infoText}>
                  <a href="mailto:manibeautygh@gmail.com" className={styles.infoLink}>manibeautygh@gmail.com</a>
                </p>
              </div>

              <div className={`${styles.infoCard} ${styles.infoCardGreen}`}>
                <div className={styles.infoEmoji}>🕐</div>
                <h3 className={styles.infoTitle}>Working Hours</h3>
                <p className={styles.infoText}>Mon-Sat: 8:30AM-7PM</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Modal Notification */}
      <ModalNotification
        isOpen={isSuccess}
        type="success"
        title="Booking Confirmed!"
        message={bookingPaymentAmount > 0 ? 'Your appointment is reserved. Pay the full service price securely with Paystack.' : "Thank you! We'll contact you shortly to confirm your appointment and price."}
        reference={bookingReference}
        details={[
          ...(bookingNotice ? [bookingNotice] : []),
          "We'll contact you with your confirmation",
          "Check your phone for our message",
        ]}
        actions={[
          ...(bookingPaymentAmount > 0 ? [{
            label: isStartingPayment ? 'Opening Paystack...' : `Pay GH₵${bookingPaymentAmount.toFixed(2)} in Full`,
            onClick: handleBookingPayment,
            primary: true,
          }] : []),
          {
            label: 'Close',
            onClick: () => setIsSuccess(false),
            primary: bookingPaymentAmount <= 0,
          },
        ]}
        onClose={() => setIsSuccess(false)}
      />
    </>
  )
}
