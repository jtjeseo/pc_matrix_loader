// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Planning Center API errors
  if (err.response && err.response.data) {
    const pcError = err.response.data;
    return res.status(err.response.status || 500).json({
      error: 'Planning Center API Error',
      message: pcError.errors?.[0]?.detail || pcError.message || 'Unknown API error',
      status: err.response.status
    });
  }

  // OAuth errors
  if (err.name === 'TokenError') {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Invalid or expired token'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.errors
    });
  }

  // Rate limit errors
  if (err.name === 'TooManyRequestsError') {
    return res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: 'Too many requests, please try again later'
    });
  }

  // Default server error
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message
  });
};

module.exports = {
  errorHandler
};
