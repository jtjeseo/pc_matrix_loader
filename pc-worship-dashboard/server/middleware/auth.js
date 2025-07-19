const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const axios = require('axios');

// Configure OAuth2 strategy for Planning Center
passport.use('planningcenter', new OAuth2Strategy({
  authorizationURL: 'https://api.planningcenteronline.com/oauth/authorize',
  tokenURL: 'https://api.planningcenteronline.com/oauth/token',
  clientID: process.env.PC_CLIENT_ID,
  clientSecret: process.env.PC_CLIENT_SECRET,
  callbackURL: process.env.PC_REDIRECT_URI,
  scope: 'services people' // We need both services and people scopes
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Get user information from Planning Center
    const userResponse = await axios.get('https://api.planningcenteronline.com/people/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'PC Worship Dashboard (worship-dashboard@example.com)'
      }
    });

    const user = {
      id: userResponse.data.data.id,
      name: userResponse.data.data.attributes.name,
      email: userResponse.data.data.attributes.primary_email,
      accessToken,
      refreshToken,
      tokenExpiresAt: Date.now() + (7200 * 1000) // 2 hours from now
    };

    return done(null, user);
  } catch (error) {
    console.error('Error fetching user profile:', error.response?.data || error.message);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Function to refresh access token
async function refreshAccessToken(refreshToken) {
  try {
    const response = await axios.post('https://api.planningcenteronline.com/oauth/token', {
      client_id: process.env.PC_CLIENT_ID,
      client_secret: process.env.PC_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PC Worship Dashboard (worship-dashboard@example.com)'
      }
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      tokenExpiresAt: Date.now() + (response.data.expires_in * 1000)
    };
  } catch (error) {
    console.error('Error refreshing token:', error.response?.data || error.message);
    throw new Error('Failed to refresh access token');
  }
}

module.exports = {
  refreshAccessToken
};
