const express = require('express');
const passport = require('passport');
const router = express.Router();

// Import passport configuration
require('../middleware/auth');

// Start OAuth flow
router.get('/login', passport.authenticate('planningcenter', {
  scope: ['services', 'people'] // Required scopes per PC documentation
}));

// OAuth callback handler
router.get('/callback', 
  passport.authenticate('planningcenter', { 
    failureRedirect: '/auth/error',
    failureMessage: true 
  }),
  (req, res) => {
    // Successful authentication
    console.log('User authenticated successfully:', req.user.name);
    
    // Redirect to frontend dashboard
    const redirectUrl = process.env.NODE_ENV === 'production' 
      ? '/dashboard' 
      : 'http://localhost:5173/dashboard';
      
    res.redirect(redirectUrl);
  }
);

// Get current user info
router.get('/user', (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      authenticated: false,
      message: 'Not authenticated'
    });
  }

  res.json({
    authenticated: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    }
  });
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        error: 'Logout failed',
        message: err.message
      });
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  });
});

// Authentication error handler
router.get('/error', (req, res) => {
  const message = req.session.messages ? req.session.messages[0] : 'Authentication failed';
  res.status(401).json({
    error: 'Authentication Error',
    message: message
  });
});

module.exports = router;
