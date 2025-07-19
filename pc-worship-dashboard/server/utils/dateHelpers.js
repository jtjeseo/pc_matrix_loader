// Date utility functions for Planning Center API

/**
 * Format date for Planning Center API (ISO 8601)
 * @param {Date|string} date - Date to format
 * @returns {string} ISO 8601 formatted date
 */
function formatDateForAPI(date) {
  if (!date) return null;
  
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date provided');
  }
  
  return d.toISOString().split('T')[0]; // YYYY-MM-DD format
}

/**
 * Calculate date range for months back from today
 * @param {number} monthsBack - Number of months to go back
 * @returns {object} Object with startDate and endDate
 */
function getDateRangeFromMonthsBack(monthsBack = 12) {
  const today = new Date();
  const endDate = new Date(today);
  
  // Set to end of today
  endDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date(today);
  startDate.setMonth(today.getMonth() - monthsBack);
  startDate.setDate(1); // First day of the month
  startDate.setHours(0, 0, 0, 0);
  
  return {
    startDate: formatDateForAPI(startDate),
    endDate: formatDateForAPI(endDate)
  };
}

/**
 * Get predefined date ranges
 * @returns {object} Object with common date ranges
 */
function getPresetDateRanges() {
  const today = new Date();
  
  return {
    last3Months: getDateRangeFromMonthsBack(3),
    last6Months: getDateRangeFromMonthsBack(6),
    last12Months: getDateRangeFromMonthsBack(12),
    thisYear: {
      startDate: formatDateForAPI(new Date(today.getFullYear(), 0, 1)),
      endDate: formatDateForAPI(today)
    },
    lastYear: {
      startDate: formatDateForAPI(new Date(today.getFullYear() - 1, 0, 1)),
      endDate: formatDateForAPI(new Date(today.getFullYear() - 1, 11, 31))
    }
  };
}

/**
 * Validate date range
 * @param {string} startDate - Start date string
 * @param {string} endDate - End date string
 * @returns {object} Validation result
 */
function validateDateRange(startDate, endDate) {
  const errors = [];
  
  if (startDate && !isValidDateString(startDate)) {
    errors.push('Invalid start date format. Use YYYY-MM-DD.');
  }
  
  if (endDate && !isValidDateString(endDate)) {
    errors.push('Invalid end date format. Use YYYY-MM-DD.');
  }
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      errors.push('Start date must be before end date.');
    }
    
    // Check if range is too large (more than 3 years)
    const diffYears = (end - start) / (1000 * 60 * 60 * 24 * 365);
    if (diffYears > 3) {
      errors.push('Date range cannot exceed 3 years.');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if string is valid date format
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid
 */
function isValidDateString(dateString) {
  if (!dateString) return false;
  
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDateForDisplay(date) {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get relative time description
 * @param {string|Date} date - Date to get relative time for
 * @returns {string} Relative time description
 */
function getRelativeTime(date) {
  if (!date) return '';
  
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  
  return `${Math.floor(diffDays / 365)} years ago`;
}

module.exports = {
  formatDateForAPI,
  getDateRangeFromMonthsBack,
  getPresetDateRanges,
  validateDateRange,
  isValidDateString,
  formatDateForDisplay,
  getRelativeTime
};
