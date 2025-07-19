const { refreshAccessToken } = require('./auth');

// Middleware to ensure user is authenticated
const authMiddleware = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  }

  // Check if token is expired and refresh if needed
  if (req.user.tokenExpiresAt && Date.now() >= req.user.tokenExpiresAt - 300000) { // Refresh 5 minutes before expiry
    try {
      const newTokens = await refreshAccessToken(req.user.refreshToken);
      
      // Update user session with new tokens
      req.user.accessToken = newTokens.accessToken;
      req.user.refreshToken = newTokens.refreshToken;
      req.user.tokenExpiresAt = newTokens.tokenExpiresAt;
      
      // Save updated session
      req.session.passport.user = req.user;
      
      console.log('Access token refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh access token:', error.message);
      return res.status(401).json({
        error: 'Token refresh failed',
        message: 'Please log in again'
      });
    }
  }

  next();
};

// Middleware to get current user info
const getCurrentUser = (req, res, next) => {
  res.locals.currentUser = req.user || null;
  next();
};

module.exports = {
  authMiddleware,
  getCurrentUser
};
