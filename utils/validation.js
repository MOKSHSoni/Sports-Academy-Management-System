/**
 * Validation utilities for form inputs
 * Provides centralized validation and sanitization functions
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation - basic international format
const PHONE_REGEX = /^[\d\s\-\+\(\)]+$/;

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate phone format (basic check)
 * @param {string} phone - Phone number to validate
 * @returns {boolean}
 */
function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  return phone.trim().length >= 7 && PHONE_REGEX.test(phone);
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize string input - trim and basic XSS prevention
 * @param {string} input - Input to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string}
 */
function sanitizeString(input, maxLength = 500) {
  if (!input || typeof input !== 'string') return '';
  let sanitized = input.trim().substring(0, maxLength);
  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  return sanitized;
}

/**
 * Validate required fields
 * @param {object} obj - Object containing fields to check
 * @param {array} fields - Array of field names that are required
 * @returns {object} - { isValid: boolean, error?: string }
 */
function validateRequired(obj, fields) {
  for (const field of fields) {
    if (!obj[field] || (typeof obj[field] === 'string' && !obj[field].trim())) {
      return { isValid: false, error: `${field} is required` };
    }
  }
  return { isValid: true };
}

/**
 * Validate string length
 * @param {string} input - Input to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @returns {object} - { isValid: boolean, error?: string }
 */
function validateStringLength(input, minLength = 0, maxLength = 500) {
  if (!input || typeof input !== 'string') {
    return { isValid: false, error: 'Input must be a string' };
  }
  const length = input.trim().length;
  if (length < minLength) {
    return { isValid: false, error: `Minimum ${minLength} characters required` };
  }
  if (length > maxLength) {
    return { isValid: false, error: `Maximum ${maxLength} characters allowed` };
  }
  return { isValid: true };
}

/**
 * Validate number range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {object} - { isValid: boolean, error?: string }
 */
function validateNumberRange(value, min = 0, max = 999999) {
  const num = Number(value);
  if (isNaN(num)) {
    return { isValid: false, error: 'Must be a valid number' };
  }
  if (num < min) {
    return { isValid: false, error: `Minimum value is ${min}` };
  }
  if (num > max) {
    return { isValid: false, error: `Maximum value is ${max}` };
  }
  return { isValid: true };
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} dateStr - Date string to validate
 * @param {boolean} futureOnly - If true, date must be in future
 * @returns {object} - { isValid: boolean, error?: string }
 */
function validateDate(dateStr, futureOnly = false) {
  if (!dateStr || typeof dateStr !== 'string') {
    return { isValid: false, error: 'Date is required' };
  }
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return { isValid: false, error: 'Invalid date format (use YYYY-MM-DD)' };
  }
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date' };
  }
  
  if (futureOnly) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return { isValid: false, error: 'Date must be in the future' };
    }
  }
  
  return { isValid: true };
}

/**
 * Validate select/enum value
 * @param {string} value - Value to validate
 * @param {array} allowedValues - Array of allowed values
 * @returns {object} - { isValid: boolean, error?: string }
 */
function validateEnum(value, allowedValues) {
  if (!value || !allowedValues.includes(value)) {
    return { isValid: false, error: `Must be one of: ${allowedValues.join(', ')}` };
  }
  return { isValid: true };
}

/**
 * Comprehensive contact form validation
 * @param {object} data - Form data
 * @returns {object} - { isValid: boolean, errors?: object }
 */
function validateContactForm(data) {
  const errors = {};

  // Name validation
  let validation = validateStringLength(data.name, 2, 100);
  if (!validation.isValid) errors.name = validation.error;

  // Email validation
  if (!isValidEmail(data.email)) {
    errors.email = 'Invalid email format';
  }

  // Subject validation
  if (!data.subject || !['General Enquiry', 'Program Info', 'Trial Booking', 'Partnership', 'Other'].includes(data.subject)) {
    errors.subject = 'Invalid subject selection';
  }

  // Message validation
  validation = validateStringLength(data.message, 10, 5000);
  if (!validation.isValid) errors.message = validation.error;

  return {
    isValid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined
  };
}

/**
 * Trial booking form validation
 * @param {object} data - Form data
 * @returns {object} - { isValid: boolean, errors?: object }
 */
function validateTrialBooking(data) {
  const errors = {};

  // Name validation
  let validation = validateStringLength(data.name, 2, 100);
  if (!validation.isValid) errors.name = validation.error;

  // Email validation
  if (!isValidEmail(data.email)) {
    errors.email = 'Invalid email format';
  }

  // Phone validation (optional but must be valid if provided)
  if (data.phone && !isValidPhone(data.phone)) {
    errors.phone = 'Invalid phone format';
  }

  // Sport validation
  const validSports = ['parkour', 'calisthenics', 'rock_climbing', 'acrobatics', 'general'];
  if (!data.sport || !validSports.includes(data.sport)) {
    errors.sport = 'Invalid sport selection';
  }

  // Date validation
  if (data.preferred_date) {
    validation = validateDate(data.preferred_date, false); // Don't require future only (can book past dates)
    if (!validation.isValid) errors.preferred_date = validation.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined
  };
}

/**
 * Event form validation
 * @param {object} data - Form data
 * @returns {object} - { isValid: boolean, errors?: object }
 */
function validateEventForm(data) {
  const errors = {};

  // Title validation
  let validation = validateStringLength(data.title, 3, 200);
  if (!validation.isValid) errors.title = validation.error;

  // Sport validation
  const validSports = ['parkour', 'calisthenics', 'rock_climbing', 'acrobatics', 'general'];
  if (data.sport && !validSports.includes(data.sport)) {
    errors.sport = 'Invalid sport selection';
  }

  // Date validation
  validation = validateDate(data.event_date, false);
  if (!validation.isValid) errors.event_date = validation.error;

  // Capacity validation
  validation = validateNumberRange(data.capacity || 0, 1, 1000);
  if (!validation.isValid) errors.capacity = validation.error;

  // Fee validation
  validation = validateNumberRange(data.fee || 0, 0, 10000);
  if (!validation.isValid) errors.fee = validation.error;

  // Description length check
  if (data.description) {
    validation = validateStringLength(data.description, 0, 2000);
    if (!validation.isValid) errors.description = validation.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined
  };
}

/**
 * Program form validation
 * @param {object} data - Form data
 * @returns {object} - { isValid: boolean, errors?: object }
 */
function validateProgramForm(data) {
  const errors = {};

  // Name validation
  let validation = validateStringLength(data.name, 3, 200);
  if (!validation.isValid) errors.name = validation.error;

  // Sport validation
  const validSports = ['parkour', 'calisthenics', 'rock_climbing', 'acrobatics', 'general'];
  if (!data.sport || !validSports.includes(data.sport)) {
    errors.sport = 'Invalid sport selection';
  }

  // Level validation
  const validLevels = ['beginner', 'intermediate', 'advanced'];
  if (!data.level || !validLevels.includes(data.level)) {
    errors.level = 'Invalid level selection';
  }

  // Age group validation
  const validAgeGroups = ['kids', 'teen', 'adult', 'senior'];
  if (!data.age_group || !validAgeGroups.includes(data.age_group)) {
    errors.age_group = 'Invalid age group selection';
  }

  // Fees validation
  validation = validateNumberRange(data.fees || 0, 0, 100000);
  if (!validation.isValid) errors.fees = validation.error;

  // Capacity validation
  validation = validateNumberRange(data.max_capacity || 0, 1, 1000);
  if (!validation.isValid) errors.max_capacity = validation.error;

  // Description length check
  if (data.description) {
    validation = validateStringLength(data.description, 0, 2000);
    if (!validation.isValid) errors.description = validation.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined
  };
}

/**
 * Coach profile update validation
 * @param {object} data - Form data
 * @returns {object} - { isValid: boolean, errors?: object }
 */
function validateCoachProfileUpdate(data) {
  const errors = {};

  // Specialization validation (optional)
  if (data.specialization) {
    let validation = validateStringLength(data.specialization, 2, 150);
    if (!validation.isValid) errors.specialization = validation.error;
  }

  // Bio validation (optional)
  if (data.bio) {
    let validation = validateStringLength(data.bio, 10, 2000);
    if (!validation.isValid) errors.bio = validation.error;
  }

  // Experience years validation (optional)
  if (data.experience_years !== undefined && data.experience_years !== null && data.experience_years !== '') {
    let validation = validateNumberRange(data.experience_years, 0, 100);
    if (!validation.isValid) errors.experience_years = validation.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined
  };
}

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidUrl,
  sanitizeString,
  validateRequired,
  validateStringLength,
  validateNumberRange,
  validateDate,
  validateEnum,
  validateContactForm,
  validateTrialBooking,
  validateEventForm,
  validateProgramForm,
  validateCoachProfileUpdate
};
