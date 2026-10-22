'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, Loader, MessageSquare, User } from 'lucide-react'
import styles from '../styles/contact.module.css'
import { apiFetch } from '../../lib/api-client'

export default function ContactPage() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [currentHeroPair, setCurrentHeroPair] = useState(0)
  const heroTouchStart = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroPair((current) => (current + 1) % 2)
    }, 4500)

    return () => clearInterval(timer)
  }, [])

  const finishHeroSwipe = (clientX) => {
    if (heroTouchStart.current === null) return
    const distance = clientX - heroTouchStart.current
    if (Math.abs(distance) > 45) {
      setCurrentHeroPair((current) => distance < 0 ? (current + 1) % 2 : (current - 1 + 2) % 2)
    }
    heroTouchStart.current = null
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const response = await apiFetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to submit contact message')
      }

      setIsSuccess(true)
      reset()

      // Reset success message after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong while sending your message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Hero Section */}
      <section className={styles.hero} aria-label="Mani Beauty hairstyle inspiration">
        <img src="/images/contact-hero/IMG_9423.JPG" alt="Braided ponytail hairstyle" />
        <img src="/images/contact-hero/IMG_9424.JPG" alt="Braided updo hairstyle" />
        <img src="/images/contact-hero/IMG_9426.JPG" alt="Decorated braided updo hairstyle" />
        <img src="/images/contact-hero/IMG_9427.JPG" alt="Long embellished braids" />
        <img src="/images/contact-hero/IMG_9428.JPG" alt="Detailed cornrow braids" />
      </section>

      <section
        className={styles.mobileHero}
        aria-label="Mani Beauty hairstyle inspiration"
        onTouchStart={(event) => { heroTouchStart.current = event.touches[0].clientX }}
        onTouchEnd={(event) => finishHeroSwipe(event.changedTouches[0].clientX)}
      >
        <div className={`${styles.mobileHeroSlide} ${currentHeroPair === 0 ? styles.mobileHeroSlideActive : ''}`}>
          <img src="/images/contact-hero/IMG_9424.JPG" alt="Braided updo hairstyle" />
          <img src="/images/contact-hero/IMG_9428.JPG" alt="Long embellished braids" />
        </div>
        <div className={`${styles.mobileHeroSlide} ${currentHeroPair === 1 ? styles.mobileHeroSlideActive : ''}`}>
          <img src="/images/contact-hero/IMG_9423.JPG" alt="Braided ponytail hairstyle" />
          <img src="/images/contact-hero/IMG_9426.JPG" alt="Decorated braided updo hairstyle" />
        </div>
        <div className={styles.mobileHeroDots} aria-label="Contact hero image slides">
          {[0, 1].map((index) => (
            <button
              key={index}
              type="button"
              aria-label={`Show hairstyle images ${index + 1}`}
              className={`${styles.mobileHeroDot} ${currentHeroPair === index ? styles.mobileHeroDotActive : ''}`}
              onClick={() => setCurrentHeroPair(index)}
            />
          ))}
        </div>
      </section>

      <section className={styles.heroIntro}>
        <div className="container text-center">
          <h1 className={styles.heroTitle}>
            Let's Talk <span className="text-gradient-green">Beauty</span>
          </h1>
          <p className={styles.heroText}>
            Planning a new style, checking product availability, or booking a salon visit? Send us a message and the Mani Beauty team will guide you with care.
          </p>
        </div>
      </section>

      {/* Contact Info & Form Section */}
      <section className={styles.contactSection}>
        <div className="container">
          <div className={`grid grid-2 ${styles.contactGrid}`}>
            {/* Contact Information */}
            <div>
              <h2 className={styles.contactTitle}>
                Start the conversation
              </h2>
              <p className={styles.contactIntro}>
                Reach us at the salon branch closest to you in Haatso or Atomic, or contact us for appointments and beauty consultations serving clients from Legon, Madina and nearby areas.
              </p>

              {/* Contact Cards */}
              <div className={styles.contactCards}>
                <div className={`card ${styles.contactCard} ${styles.contactCardGreen}`}>
                  <div className={`${styles.contactIcon} ${styles.iconGreen}`}>
                    <Phone size={24} className={styles.iconWhite} />
                  </div>
                  <div>
                    <h3 className={styles.contactItemTitle}>
                      Call Us
                    </h3>
                    <p className={styles.contactAddress}>
                      <strong>Atomic Branch</strong><br />
                      <a href="tel:+233558812020" className={styles.contactItemLink}>055 881 2020</a><br />
                      <strong>Haatso Branch</strong><br />
                      <a href="tel:+233536591889" className={styles.contactItemLink}>053 659 1889</a>
                    </p>
                  </div>
                </div>

                <div className={`card ${styles.contactCard} ${styles.contactCardGreen}`}>
                  <div className={`${styles.contactIcon} ${styles.iconGreen}`}>
                    <Mail size={24} className={styles.iconWhite} />
                  </div>
                  <div>
                    <h3 className={styles.contactItemTitle}>
                      Email
                    </h3>
                    <a href="mailto:manibeautygh@gmail.com" className={styles.contactItemLink}>
                      manibeautygh@gmail.com
                    </a>
                  </div>
                </div>

                <div className={`card ${styles.contactCard} ${styles.contactCardGreen}`}>
                  <div className={`${styles.contactIcon} ${styles.iconGreen}`}>
                    <Clock size={24} className={styles.iconWhite} />
                  </div>
                  <div>
                    <h3 className={styles.contactItemTitle}>
                      Working Hours
                    </h3>
                    <div className={styles.contactHours}>
                      <p className={styles.hoursLine}><strong>Monday - Saturday:</strong> 8:00 AM - 7:00 PM</p>
                      <p className={styles.hoursLine}><strong>Sunday:</strong> 1:00 PM - 7:00 PM</p>
                    </div>
                  </div>
                </div>

                <a href="https://maps.app.goo.gl/h6Ak82vw1nKfa1QV6?g_st=iw" target="_blank" rel="noopener noreferrer" className={`card ${styles.contactCard} ${styles.contactCardGrey} ${styles.locationCard}`}>
                  <div className={`${styles.contactIcon} ${styles.iconGrey}`}>
                    <MapPin size={24} className={styles.iconWhite} />
                  </div>
                  <div>
                    <h3 className={styles.contactItemTitle}>
                      Visit Us
                    </h3>
                    <p className={styles.contactItemText}>Atomic Junction Roundabout and Haatso Branch</p>
                    <span className={styles.directionsText}>Open in Google Maps →</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Enquiry Form */}
            <div className={`card ${styles.formCard}`}>
              <h2 className={styles.formTitle}>
                Send us a Message
              </h2>
              <p className={styles.formText}>
                Share the details and we will respond with the next best step for your hair, beauty products, or salon service enquiry.
              </p>

              {/* Success Message */}
              {isSuccess && (
                <div className={styles.successMessage}>
                  <CheckCircle size={24} />
                  <div>
                    <p className={styles.successTitle}>Message sent successfully!</p>
                    <p className={styles.successText}>We'll get back to you soon.</p>
                  </div>
                </div>
              )}

              {submitError && (
                <div className={styles.errorMessage}>
                  <p className={styles.errorTitle}>Message not sent</p>
                  <p className={styles.errorText}>{submitError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Name */}
                <div className="form-group">
                  <label htmlFor="name">
                    <User size={18} className={`${styles.labelIcon} ${styles.labelGreen}`} />
                    Your Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    {...register('name', { 
                      required: 'Name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' }
                    })}
                  />
                  {errors.name && <p className="form-error">{errors.name.message}</p>}
                </div>

                {/* Email */}
                <div className="form-group">
                  <label htmlFor="email">
                    <Mail size={18} className={`${styles.labelIcon} ${styles.labelPink}`} />
                    Email Address (Optional)
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...register('email', { 
                      validate: (value) => {
                        if (!value) return true
                        return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value) || 'Invalid email address'
                      }
                    })}
                  />
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label htmlFor="phone">
                    <Phone size={18} className={`${styles.labelIcon} ${styles.labelGreen}`} />
                    Phone Number * <span style={{ fontSize: '0.85rem', color: 'var(--color-grey)' }}>(Start with +233)</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="e.g. +233 55 881 2020"
                    {...register('phone', {
                      required: 'Phone number is required',
                      minLength: { value: 8, message: 'Phone number is too short' }
                    })}
                  />
                  {errors.phone && <p className="form-error">{errors.phone.message}</p>}
                </div>

                {/* Subject */}
                <div className="form-group">
                  <label htmlFor="subject">
                    <MessageSquare size={18} className={`${styles.labelIcon} ${styles.labelGreen}`} />
                    Subject *
                  </label>
                  <input
                    id="subject"
                    type="text"
                    placeholder="Braids, products, booking, or general enquiry"
                    {...register('subject', { 
                      required: 'Subject is required',
                      minLength: { value: 3, message: 'Subject must be at least 3 characters' }
                    })}
                  />
                  {errors.subject && <p className="form-error">{errors.subject.message}</p>}
                </div>

                {/* Message */}
                <div className="form-group">
                  <label htmlFor="message">
                    <MessageSquare size={18} className={`${styles.labelIcon} ${styles.labelPink}`} />
                    Your Message *
                  </label>
                  <textarea
                    id="message"
                    rows="5"
                    placeholder="Tell us what you have in mind, including preferred branch, style, date, or product details."
                    {...register('message', { 
                      required: 'Message is required',
                      minLength: { value: 10, message: 'Message must be at least 10 characters' }
                    })}
                  />
                  {errors.message && <p className="form-error">{errors.message.message}</p>}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`btn btn-primary ${styles.submitButton} ${isSubmitting ? styles.submitButtonDisabled : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="loading" size={20} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

    </>
  )
}
