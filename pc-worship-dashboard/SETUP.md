# Planning Center Worship Dashboard - Setup Guide

## 1. Planning Center OAuth App Setup

To connect to Planning Center's API, you need to register an OAuth application:

### Step 1: Create Planning Center Developer App
1. Go to: https://api.planningcenteronline.com/oauth/applications
2. Sign in with your Planning Center account
3. Click "Register a new application"
4. Fill out the form:
   - **Application Name**: "Worship Dashboard" (or your preferred name)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:8000/auth/callback`
   - **Scopes**: Select `services` and `people`

### Step 2: Get Your Credentials
After creating the app, you'll get:
- **Application ID** (Client ID)
- **Secret** (Client Secret)

### Step 3: Update Environment File
Copy these values into `/pc-worship-dashboard/.env`:

```bash
PC_CLIENT_ID=your_application_id_here
PC_CLIENT_SECRET=your_secret_here
```

## 2. Generate Session Secret

For security, generate a random session secret:

```bash
# Run this command and copy the output to SESSION_SECRET in .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3. Start the Application

```bash
# Terminal 1: Start backend server
cd pc-worship-dashboard
npm run dev

# Terminal 2: Start frontend development server  
cd pc-worship-dashboard/client
npm run dev
```

## 4. Access the Dashboard

1. Open http://localhost:3000 in your browser
2. Click "Sign in with Planning Center"
3. Authorize the app when prompted
4. You should be redirected back to the dashboard

## Troubleshooting

### Common Issues:

1. **403 Forbidden**: Make sure `User-Agent` header is set in API requests
2. **OAuth Redirect Mismatch**: Ensure callback URL matches exactly in PC app settings
3. **Scopes Error**: Verify `services` and `people` scopes are enabled in PC app
4. **CORS Issues**: Check that CLIENT_URL in .env matches your frontend URL

### Check Logs:
- Backend logs: Look for OAuth flow and API request logs
- Frontend logs: Check browser console for any errors
- Network tab: Verify API requests are reaching the backend

### Test Connection:
Once logged in, the dashboard should show:
- Service statistics
- Singer performance data
- Song frequency charts

If you see empty data, check that your Planning Center account has access to Services data.
