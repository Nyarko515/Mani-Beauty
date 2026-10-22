// Centralized configuration file for all customizable values
// Import this in any file where you need to modify text, colors, limits, etc.

// ============================================
// BUSINESS CONFIGURATION
// ============================================

export const BUSINESS_INFO = {
  name: 'Mani Beauty',
  phone: '+233500009547',
  email: 'manibeautygh@gmail.com',
  address: 'Accra, Ghana',
  whatsapp: '+233500009547',
  logo: '/images/logo.png',
}

// ============================================
// BOOKING CONFIGURATION
// ============================================

export const BOOKING_CONFIG = {
  // Default deposit amount (in GHS) - Change this if deposit requirement changes
  DEFAULT_DEPOSIT_AMOUNT: 0, // Set to 0 for no deposit, or any amount like 100

  // Future bookings can only be made within this many days
  MAX_DAYS_IN_ADVANCE: 90,

  // Booking confirmation message shown to users
  SUCCESS_MESSAGE: 'Booking Request Submitted! Thank you! We\'ll contact you shortly to confirm your appointment.',

  // How many minutes to check back for duplicate bookings
  DUPLICATE_CHECK_WINDOW_MINUTES: 5,

  // Reference image upload
  MAX_IMAGE_SIZE_MB: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
}

// ============================================
// RATE LIMITING CONFIGURATION
// ============================================

export const RATE_LIMITS = {
  // Booking form submissions
  BOOKINGS_PER_IP_PER_HOUR: 10,
  
  // Product order form submissions
  ORDERS_PER_IP_PER_HOUR: 20,
  
  // API read operations (catalog, etc)
  API_READ_PER_IP_PER_MINUTE: 60,
  
  // API write operations
  API_WRITE_PER_IP_PER_MINUTE: 30,
}

// ============================================
// PAYMENT (PAYSTACK) CONFIGURATION
// ============================================

export const PAYMENT_CONFIG = {
  // Set this to true if deposits should be required
  DEPOSITS_ENABLED: true,
  
  // Percentage of the displayed service price charged at booking
  BOOKING_DEPOSIT_PERCENTAGE: 100,
  
  // Percentage of a fixed-price product order charged at checkout
  ORDER_DEPOSIT_PERCENTAGE: 100,
  
  // Test mode flag (true = test transactions, false = live)
  TEST_MODE: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.includes('test') || false,
}

// ============================================
// NOTIFICATION CONFIGURATION
// ============================================

export const NOTIFICATION_CONFIG = {
  // Email sender address
  BOOKING_EMAIL_FROM: process.env.BOOKING_NOTIFICATION_FROM || 'bookings@manibeauty.com',
  
  // SMS sender ID (must be 11 chars or less)
  SMS_SENDER_ID: 'ManiBeauty',
  
  // Enable/disable different notification channels
  CHANNELS_ENABLED: {
    EMAIL: true,
    SMS: true,
    WHATSAPP: true,
  },
  
  // Admin notification numbers (comma-separated if multiple)
  ADMIN_PHONE: process.env.BOOKING_SMS_TO || '+233500009547',
}

// ============================================
// ADMIN CONFIGURATION
// ============================================

export const ADMIN_CONFIG = {
  // Page title
  DASHBOARD_TITLE: 'Admin Dashboard',
  
  // Items per page in tables
  ITEMS_PER_PAGE: 20,
  
  // Default booking status when created
  DEFAULT_BOOKING_STATUS: 'pending',
  
  // Available booking statuses
  BOOKING_STATUSES: [
    { value: 'pending', label: 'Pending', color: '#FFA500' },
    { value: 'confirmed', label: 'Confirmed', color: '#00AA00' },
    { value: 'completed', label: 'Completed', color: '#0066FF' },
    { value: 'cancelled', label: 'Cancelled', color: '#CC0000' },
  ],
}

// ============================================
// VALIDATION RULES
// ============================================

export const VALIDATION = {
  // Phone number pattern
  PHONE_PATTERN: /^[0-9\s\-()\.+]{7,15}$/,
  
  // Email pattern
  EMAIL_PATTERN: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  
  // Minimum and maximum lengths
  FIELD_LENGTHS: {
    NAME_MIN: 2,
    NAME_MAX: 100,
    EMAIL_MAX: 255,
    PHONE_MAX: 40,
    NOTES_MAX: 1000,
    ADDRESS_MAX: 255,
  },
}

// ============================================
// UI/UX CONFIGURATION
// ============================================

export const UI_CONFIG = {
  // Success message auto-hide timeout (ms)
  SUCCESS_MESSAGE_TIMEOUT: 5000,
  
  // Error message auto-hide timeout (ms)
  ERROR_MESSAGE_TIMEOUT: 8000,
  
  // Default theme colors
  COLORS: {
    PRIMARY: '#FF6B9D',
    SECONDARY: '#C41E3A',
    SUCCESS: '#00AA00',
    ERROR: '#CC0000',
    WARNING: '#FFA500',
    INFO: '#0066FF',
  },
  
  // Admin mode CSS class
  ADMIN_MODE_CLASS: 'admin-mode',
}

// ============================================
// LOGGING & DEBUG CONFIGURATION
// ============================================

export const DEBUG_CONFIG = {
  // Set to true to log API requests/responses in console
  LOG_API_CALLS: process.env.NODE_ENV !== 'production',
  
  // Set to true to log all data operations
  LOG_DATA_OPERATIONS: process.env.NODE_ENV !== 'production',
  
  // Set to true to log Supabase queries
  LOG_SUPABASE: process.env.NODE_ENV !== 'production',
  
  // Set to true to log payment operations
  LOG_PAYMENTS: process.env.NODE_ENV !== 'production',
}

// ============================================
// SECURITY CONFIGURATION
// ============================================

export const SECURITY_CONFIG = {
  // CSRF token lifetime (hours)
  CSRF_TOKEN_LIFETIME: 8,
  
  // Admin session timeout (minutes)
  SESSION_TIMEOUT_MINUTES: 30,
  
  // Enable CORS
  CORS_ENABLED: true,
  
  // Allowed CORS origins
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001'],
}

// ============================================
// DATABASE CONFIGURATION
// ============================================

export const DB_CONFIG = {
  // Enable Supabase sync
  SUPABASE_ENABLED: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  
  // Fallback to local JSON if Supabase unavailable
  FALLBACK_TO_LOCAL: true,
  
  // Data directory (relative to project root)
  DATA_DIR: 'data',
}

// ============================================
// HELPER FUNCTIONS FOR COMMON CUSTOMIZATIONS
// ============================================

// Get notification email subject
export function getEmailSubject(type) {
  const subjects = {
    booking_confirmation: 'Your Mani Beauty Booking Confirmation',
    booking_admin_notification: 'New Booking - Mani Beauty',
    order_confirmation: 'Your Mani Beauty Order Confirmation',
    order_admin_notification: 'New Product Order - Mani Beauty',
  }
  return subjects[type] || 'Mani Beauty Notification'
}

// Get error message
export function getErrorMessage(code) {
  const messages = {
    INVALID_PHONE: 'Phone number must be valid and start with +233',
    INVALID_EMAIL: 'Email address is not valid',
    INVALID_SERVICE: 'Please select a valid service',
    INVALID_DATE: 'Please select a valid date',
    INVALID_TIME: 'Please select a valid time',
    FILE_TOO_LARGE: `File size must not exceed ${BOOKING_CONFIG.MAX_IMAGE_SIZE_MB}MB`,
    INVALID_FILE_TYPE: 'Only images are allowed',
    BOOKING_DUPLICATE: 'This booking was just created. Please check your bookings.',
    TOO_MANY_REQUESTS: 'Too many requests. Please try again in a few moments.',
    BOOKING_FAILED: 'Failed to create booking. Please try again.',
    SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
  }
  return messages[code] || 'An unexpected error occurred'
}

export default {
  BUSINESS_INFO,
  BOOKING_CONFIG,
  RATE_LIMITS,
  PAYMENT_CONFIG,
  NOTIFICATION_CONFIG,
  ADMIN_CONFIG,
  VALIDATION,
  UI_CONFIG,
  DEBUG_CONFIG,
  SECURITY_CONFIG,
  DB_CONFIG,
  getEmailSubject,
  getErrorMessage,
}
