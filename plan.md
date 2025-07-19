# Planning Center Worship Dashboard - Full Development Plan

## Project Overview

Building a modern, responsive web application that provides comprehensive worship planning insights by connecting directly to Planning Center's API. This will replace the current static report system with a dynamic, real-time dashboard for tracking singer assignments, song frequency, and service planning.

## Current State Analysis

### Existing Assets

- **Liquid Report Template**: Processes service plans to extract singer assignments from "Person" and "Vocals" note categories
- **Report Tools**: JavaScript aggregation and filtering for improved data presentation
- **Bookmarklet System**: Automated service loading for historical data
- **HTML Reports**: Static output with search/filter capabilities

### Key Features to Preserve

- Singer assignment tracking by song
- Song frequency analysis
- Date range filtering
- Search functionality across singers and songs
- Service plan links for reference
- Aggregated view showing multiple performances per song

## Planning Center API Implementation Details

### Official API Documentation Summary

**Base URL**: `https://api.planningcenteronline.com`
**API Format**: JSON-API 1.0 specification compliant
**Required Headers**: 
- `Authorization: Bearer {access_token}` (OAuth) or Basic Auth for PATs
- `User-Agent: {app_name} ({contact_info})` - **REQUIRED** or requests return 403

### Authentication (OAuth 2.0 Flow)

```bash
# Step 1: Authorization URL
https://api.planningcenteronline.com/oauth/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&response_type=code&scope=services%20people

# Step 2: Token Exchange
curl -X POST https://api.planningcenteronline.com/oauth/token \
  -F grant_type=authorization_code \
  -F code=AUTHORIZATION_CODE \
  -F client_id=CLIENT_ID \
  -F client_secret=CLIENT_SECRET \
  -F redirect_uri=REDIRECT_URI

# Step 3: Token Refresh
curl -X POST https://api.planningcenteronline.com/oauth/token \
  -H 'Content-Type: application/json' \
  -d '{
    "client_id": "CLIENT_ID",
    "client_secret": "CLIENT_SECRET", 
    "refresh_token": "REFRESH_TOKEN",
    "grant_type": "refresh_token"
  }'
```

**Token Details**:
- Access tokens expire after **2 hours**
- Refresh tokens valid for **90 days**
- Required scopes: `services` and `people`

### Services API Endpoints Structure

#### Base Pattern
```
GET https://api.planningcenteronline.com/services/v2/{resource}
```

#### Key Endpoints for Our Use Case

```bash
# 1. Get Service Types
GET /services/v2/service_types
# Returns: List of service types (Sunday Service, Wednesday Night, etc.)

# 2. Get Plans for a Service Type with Date Filtering
GET /services/v2/service_types/{service_type_id}/plans?where[sort_date][gte]=2024-01-01&where[sort_date][lte]=2024-12-31&include=items,team_members&per_page=100

# 3. Get Plan Items (Songs) with Notes
GET /services/v2/plans/{plan_id}/items?include=notes&where[item_type]=song

# 4. Get Item Notes (Contains Singer Assignments)
GET /services/v2/items/{item_id}/notes

# 5. Get Team Members for a Plan
GET /services/v2/plans/{plan_id}/team_members?include=person

# 6. Get Current User Info
GET /people/v2/me
```

#### JSON-API Response Format

```json
{
  "data": [
    {
      "type": "Plan",
      "id": "12345",
      "attributes": {
        "title": "Sunday Service",
        "sort_date": "2024-07-18T00:00:00Z",
        "created_at": "2024-07-01T10:30:00Z"
      },
      "relationships": {
        "items": {
          "data": [
            {"type": "Item", "id": "67890"}
          ]
        },
        "team_members": {
          "data": [
            {"type": "TeamMember", "id": "11111"}
          ]
        }
      }
    }
  ],
  "included": [
    {
      "type": "Item",
      "id": "67890", 
      "attributes": {
        "title": "Amazing Grace",
        "item_type": "song"
      },
      "relationships": {
        "notes": {
          "data": [
            {"type": "Note", "id": "22222"}
          ]
        }
      }
    },
    {
      "type": "Note",
      "id": "22222",
      "attributes": {
        "category_name": "Person",
        "note": "John Doe + Jane Smith"
      }
    }
  ],
  "meta": {
    "total_count": 150,
    "count": 25
  },
  "links": {
    "next": "https://api.planningcenteronline.com/services/v2/service_types/123/plans?page[offset]=25&page[size]=25"
  }
}
```

### Date Filtering & Pagination

**Date Format**: ISO 8601 (`YYYY-MM-DDTHH:MM:SSZ`)
**Timezone Handling**: Dates without time assumed to be in organization's timezone

```bash
# Date range filtering
?where[sort_date][gte]=2024-01-01&where[sort_date][lte]=2024-12-31

# Pagination
?page[offset]=0&page[size]=100&per_page=100

# Including related resources
?include=items,team_members,notes
```

### Error Handling Standards

```json
{
  "errors": [
    {
      "title": "Unauthorized", 
      "detail": "Invalid access token",
      "status": "401"
    }
  ]
}
```

### Rate Limiting
- No specific limits documented
- Implement exponential backoff for 429 responses
- Use caching to minimize API calls

### Data Structure Mapping

```text
Service Plan -> Items (Songs) -> Notes (Person/Vocals assignments)
                             -> Team Members (Full assignment details)
```

## Implementation Strategy

### Planning Center API Client Architecture

Based on official PC API documentation, our API client will follow this exact structure:

```javascript
class PlanningCenterAPI {
  constructor(accessToken) {
    this.baseURL = 'https://api.planningcenteronline.com';
    this.token = accessToken;
    this.userAgent = 'PC Worship Dashboard (worship-dashboard@example.com)';
  }

  // Core request method following PC API standards
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'User-Agent': this.userAgent,
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new PlanningCenterError(errorData, response.status);
      }
      
      return await response.json();
    } catch (error) {
      throw new PlanningCenterError(error.message, error.status || 500);
    }
  }

  // Get service types with exact PC API structure  
  async getServiceTypes() {
    return this.request('/services/v2/service_types');
  }

  // Get plans with date filtering per PC documentation
  async getPlans(serviceTypeId, options = {}) {
    const params = new URLSearchParams();
    
    if (options.startDate) {
      params.append('where[sort_date][gte]', options.startDate);
    }
    if (options.endDate) {
      params.append('where[sort_date][lte]', options.endDate);  
    }
    
    params.append('include', 'items,team_members');
    params.append('per_page', '100');
    
    return this.paginate(`/services/v2/service_types/${serviceTypeId}/plans?${params}`);
  }

  // Get plan items (songs) with notes
  async getPlanItems(planId) {
    const params = new URLSearchParams({
      'include': 'notes',
      'where[item_type]': 'song',
      'per_page': '100'
    });
    
    return this.request(`/services/v2/plans/${planId}/items?${params}`);
  }

  // Handle pagination per PC API standards
  async paginate(endpoint) {
    let allData = [];
    let nextUrl = endpoint;
    
    while (nextUrl) {
      const response = await this.request(nextUrl.replace(this.baseURL, ''));
      allData = allData.concat(response.data);
      
      nextUrl = response.links?.next;
    }
    
    return { data: allData };
  }
}

class PlanningCenterError extends Error {
  constructor(errorData, status) {
    super(errorData.errors?.[0]?.detail || errorData.message || 'Planning Center API Error');
    this.status = status;
    this.errors = errorData.errors || [];
  }
}
```

### Data Processing Pipeline (Following PC JSON-API Format)

```javascript
class DataProcessor {
  static extractSingerAssignments(planData) {
    const assignments = [];
    
    planData.data.forEach(plan => {
      const planId = plan.id;
      const planDate = plan.attributes.sort_date;
      
      // Find included items for this plan
      const planItems = planData.included
        .filter(item => item.type === 'Item' && item.attributes.item_type === 'song');
      
      planItems.forEach(item => {
        // Find notes for this item
        const itemNotes = planData.included
          .filter(note => 
            note.type === 'Note' && 
            (note.attributes.category_name === 'Person' || 
             note.attributes.category_name === 'Vocals')
          );
        
        itemNotes.forEach(note => {
          const singers = this.normalizeSingers(note.attributes.note);
          singers.forEach(singer => {
            assignments.push({
              singer: singer.trim(),
              song: item.attributes.title,
              date: planDate,
              planId: planId,
              serviceType: plan.attributes.service_type_name
            });
          });
        });
      });
    });
    
    return assignments;
  }
  
  static normalizeSingers(noteText) {
    // Follow existing liquid template logic
    return noteText
      .replace(/\//g, '+')
      .replace(/&/g, '+')
      .split('+')
      .map(s => s.trim())
      .filter(Boolean);
  }
}
```

## Technical Architecture

### Backend (Node.js/Express)

```
├── server/
│   ├── app.js                 # Express app setup
│   ├── routes/
│   │   ├── auth.js           # OAuth handling
│   │   ├── api.js            # Planning Center API proxy
│   │   └── dashboard.js      # Dashboard data endpoints
│   ├── middleware/
│   │   ├── auth.js           # Authentication middleware
│   │   └── cors.js           # CORS configuration
│   ├── services/
│   │   ├── PlanningCenterAPI.js  # API client wrapper
│   │   ├── DataProcessor.js      # Business logic for data aggregation
│   │   └── CacheManager.js       # Response caching
│   └── utils/
│       ├── dateHelpers.js    # Date range calculations
│       └── dataTransforms.js # Data transformation utilities
```

### Frontend (React/Vite)

```
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx         # Main dashboard container
│   │   │   ├── FilterPanel.jsx       # Date range, search, dropdown filters
│   │   │   ├── SingerSection.jsx     # Individual singer performance tables
│   │   │   ├── SongFrequency.jsx     # Song frequency analysis
│   │   │   ├── LoadingSpinner.jsx    # Loading states
│   │   │   └── ErrorBoundary.jsx     # Error handling
│   │   ├── hooks/
│   │   │   ├── useAuth.js           # Authentication state
│   │   │   ├── usePlanningCenter.js  # API calls
│   │   │   └── useFilters.js        # Filter state management
│   │   ├── services/
│   │   │   ├── api.js               # API client
│   │   │   └── auth.js              # Authentication helpers
│   │   ├── utils/
│   │   │   ├── dataAggregation.js   # Client-side data processing
│   │   │   └── dateFormatters.js    # Date formatting utilities
│   │   └── styles/
│   │       ├── Dashboard.css        # Component styles
│   │       └── globals.css          # Global styles
│   ├── public/
│   └── package.json
```

## Core Features Implementation

### 1. Authentication Flow

- OAuth 2.0 integration with Planning Center
- Secure token storage and refresh
- User session management
- Redirect handling for callback URL

### 2. Data Fetching Strategy

```javascript
// Parallel data fetching for performance
async function fetchDashboardData(dateRange) {
  const [serviceTypes, plans, teamMembers] = await Promise.all([
    api.getServiceTypes(),
    api.getPlansInDateRange(serviceTypeId, dateRange),
    api.getTeamMembersForPlans(planIds)
  ]);
  
  // Process and aggregate data
  return DataProcessor.aggregatePerformances(plans, teamMembers);
}
```

### 3. Data Processing Pipeline

1. **Fetch Service Plans**: Get plans within date range
2. **Extract Song Items**: Filter for song-type items
3. **Get Singer Assignments**: Parse "Person" and "Vocals" notes
4. **Normalize Singer Names**: Handle separators (/, &, +)
5. **Aggregate by Singer**: Group performances by person
6. **Calculate Frequencies**: Count song performances per singer
7. **Sort and Rank**: Order by frequency and recency

### 4. Enhanced UI Components

#### Filter Panel

- **Date Range Picker**: Calendar component for start/end dates
- **Quick Presets**: Last 3/6/12 months buttons
- **Singer Dropdown**: Multi-select with search
- **Song Search**: Real-time search across all songs
- **Service Type Filter**: Filter by specific service types

#### Dashboard Layout

```
┌─────────────────────────────────────────────┐
│ Header: Planning Center Worship Dashboard   │
├─────────────────────────────────────────────┤
│ Filter Panel: [Date Range] [Search] [Filters] │
├─────────────────────────────────────────────┤
│ Summary Cards: Total Songs | Unique Singers │
├─────────────────────────────────────────────┤
│ Singer Sections (Collapsible):              │
│ ┌─ Singer Name ────────────────────────────┐ │
│ │ [Aggregated Song Table]                  │ │
│ │ Singer | Song | Dates | Count | Links    │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 5. Advanced Features

#### Real-time Updates

- WebSocket connection for live data updates
- Automatic refresh when new services are scheduled
- Push notifications for planning changes

#### Analytics Dashboard

- **Song Popularity Trends**: Charts showing song frequency over time
- **Singer Activity**: Performance frequency per singer
- **Service Type Analysis**: Breakdown by service type
- **Seasonal Patterns**: Identify seasonal song preferences

#### Export Capabilities

- PDF report generation
- CSV data export
- Print-friendly views
- Email report scheduling

## API Integration Details

### Planning Center Services Integration

```javascript
class PlanningCenterAPI {
  constructor(accessToken) {
    this.baseURL = 'https://api.planningcenteronline.com';
    this.token = accessToken;
  }

  async getServiceTypes() {
    return this.request('/services/v2/service_types');
  }

  async getPlans(serviceTypeId, options = {}) {
    const params = new URLSearchParams({
      'filter[after]': options.startDate,
      'filter[before]': options.endDate,
      'include': 'items,team_members',
      'per_page': 100
    });
    
    return this.paginate(`/services/v2/service_types/${serviceTypeId}/plans?${params}`);
  }

  async getPlanItems(planId) {
    return this.request(`/services/v2/plans/${planId}/items?include=notes`);
  }
}
```

### Data Transformation

```javascript
class DataProcessor {
  static aggregatePerformances(plans, teamMembers) {
    const performances = [];
    
    plans.forEach(plan => {
      plan.items
        .filter(item => item.item_type === 'song')
        .forEach(song => {
          const singers = this.extractSingers(song.notes);
          singers.forEach(singer => {
            performances.push({
              singer: this.normalizeSinger(singer),
              song: song.title,
              date: plan.sort_date,
              planId: plan.id,
              serviceType: plan.service_type.name
            });
          });
        });
    });

    return this.groupBySinger(performances);
  }

  static extractSingers(notes) {
    return notes
      .filter(note => ['Person', 'Vocals'].includes(note.category_name))
      .map(note => note.note)
      .filter(Boolean);
  }
}
```

## Development Phases

### Phase 1: Foundation (Week 1-2)

- [ ] Set up project structure (Node.js + React)
- [ ] Implement OAuth 2.0 authentication
- [ ] Create Planning Center API client
- [ ] Build basic data fetching pipeline
- [ ] Design responsive UI layout

### Phase 2: Core Features (Week 3-4)

- [ ] Implement singer performance aggregation
- [ ] Build filter and search functionality
- [ ] Create collapsible singer sections
- [ ] Add date range selection
- [ ] Implement service plan links

### Phase 3: Enhanced Features (Week 5-6)

- [ ] Add data caching and optimization
- [ ] Implement real-time updates
- [ ] Build analytics dashboard
- [ ] Add export capabilities
- [ ] Performance optimization

### Phase 4: Polish & Deploy (Week 7-8)

- [ ] Comprehensive testing
- [ ] Error handling and validation
- [ ] Mobile responsiveness
- [ ] Documentation
- [ ] Deployment setup

## Technology Stack

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Authentication**: Passport.js with OAuth 2.0
- **HTTP Client**: Axios
- **Environment**: dotenv
- **Caching**: node-cache or Redis

### Frontend

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: CSS Modules + Tailwind CSS
- **State Management**: React Query + Context API
- **UI Components**: Headless UI or Radix UI
- **Date Handling**: date-fns
- **Charts**: Chart.js or Recharts

### Development Tools

- **Package Manager**: npm or yarn
- **Linting**: ESLint + Prettier
- **Testing**: Jest + React Testing Library
- **Type Checking**: PropTypes or TypeScript

## File Structure

```
pc-worship-dashboard/
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── app.js
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   └── utils/
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   ├── public/
│   └── dist/
├── shared/
│   └── types/
├── docs/
│   ├── api.md
│   └── deployment.md
└── README.md
```

## Environment Configuration

```env
# Planning Center OAuth
PC_CLIENT_ID=your_client_id
PC_CLIENT_SECRET=your_client_secret
PC_REDIRECT_URI=http://localhost:3000/auth/callback

# Application
NODE_ENV=development
PORT=3000
SESSION_SECRET=your_session_secret

# Database (if needed)
DATABASE_URL=postgresql://...

# Cache
REDIS_URL=redis://localhost:6379
```

## Security Considerations

- Secure token storage with httpOnly cookies
- CSRF protection for state-changing operations
- Rate limiting for API endpoints
- Input validation and sanitization
- Environment variable protection

## Performance Optimizations

- API response caching (15-minute TTL)
- Pagination for large datasets
- Lazy loading for singer sections
- Debounced search input
- Memoized data aggregations
- Service worker for offline capabilities

## Success Metrics

- **Load Time**: < 2 seconds initial load
- **API Response**: < 500ms average
- **Data Accuracy**: 100% match with current liquid reports
- **Mobile Experience**: Fully responsive design
- **User Satisfaction**: Improved workflow efficiency

This plan provides a comprehensive roadmap for building a modern, scalable Planning Center worship dashboard that significantly improves upon the current static report system while maintaining all existing functionality and adding powerful new features.

## Implementation Status (Updated)

### Phase 1: Core Infrastructure ✅ COMPLETE
- [x] Server Setup (Express, security middleware)
- [x] Planning Center API client implementation 
- [x] OAuth 2.0 authentication flow
- [x] Data processing service
- [x] Core API endpoints
- [x] Utility functions (dates, transforms)
- [x] Frontend React application
- [x] Component structure and routing
- [x] Dashboard UI implementation
- [ ] Integration testing

**Next Steps**: Install dependencies and run integration testing to verify OAuth flow and data processing.
