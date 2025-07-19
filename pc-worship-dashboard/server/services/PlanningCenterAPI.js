const axios = require('axios');
const NodeCache = require('node-cache');

// Cache for API responses (15 minutes TTL)
const cache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL) || 900 });

class PlanningCenterAPI {
  constructor(accessToken = null) {
    this.baseURL = 'https://api.planningcenteronline.com';
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.requestCount = 0;
    this.requestWindow = 20000; // 20 seconds
    this.maxRequests = 95; // Stay under 100 limit
    this.windowStart = Date.now();
    this.token = accessToken;
    this.userAgent = 'PC-Worship-Dashboard/1.0';
  }

  setTokenFromSession(session) {
    const accessToken = session?.passport?.user?.accessToken || session?.accessToken;
    if (!accessToken) {
      throw new Error('No access token found in session');
    }
    this.token = accessToken;
  }

  async waitForRateLimit() {
    const now = Date.now();
    
    // Reset window if 20 seconds have passed
    if (now - this.windowStart >= this.requestWindow) {
      this.requestCount = 0;
      this.windowStart = now;
    }
    
    // If we're at the limit, wait for the window to reset
    if (this.requestCount >= this.maxRequests) {
      const waitTime = this.requestWindow - (now - this.windowStart);
      console.log(`Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)} seconds...`);
      await new Promise(resolve => setTimeout(resolve, waitTime + 1000)); // Add 1 second buffer
      this.requestCount = 0;
      this.windowStart = Date.now();
    }
    
    this.requestCount++;
  }

  // Core request method following PC API standards
  async request(endpoint, options = {}) {
    // Wait for rate limit before making request
    await this.waitForRateLimit();
    
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'User-Agent': this.userAgent,
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      console.log(`Making PC API request: ${url}`);
      
      const response = await axios({
        url,
        method: options.method || 'GET',
        headers,
        data: options.data,
        timeout: 30000 // 30 second timeout
      });
      
      return response.data;
    } catch (error) {
      // Handle rate limit errors with retry
      if (error.response?.status === 429) {
        console.log('Rate limit hit, waiting before retry...');
        await new Promise(resolve => setTimeout(resolve, 21000)); // Wait 21 seconds
        this.requestCount = 0;
        this.windowStart = Date.now();
        return this.request(endpoint, options); // Retry
      }
      
      console.error('Planning Center API Error:', {
        endpoint,
        status: error.response?.status,
        message: error.response?.data || error.message
      });
      
      throw new PlanningCenterError(
        error.response?.data || { message: error.message },
        error.response?.status || 500
      );
    }
  }

  // Get service types with caching
  async getServiceTypes() {
    const cacheKey = 'service_types';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      console.log('Returning cached service types:', JSON.stringify(cached, null, 2));
      return cached;
    }

    const result = await this.request('/services/v2/service_types');
    console.log('Fresh service types result:', JSON.stringify(result, null, 2));
    cache.set(cacheKey, result, 3600); // Cache for 1 hour
    
    return result;
  }

  // Get plans with date filtering per PC documentation
  async getPlans(serviceTypeId, options = {}) {
    // Skip cache for debugging - remove this later
    const cacheKey = `plans_${serviceTypeId}_${JSON.stringify(options)}_${Date.now()}`;
    
    const params = new URLSearchParams();
    
    console.log('Date filtering options received:', options);
    
    // Use Planning Center's where syntax with proper ISO datetime format
    // Try created_at instead of sort_date - sort_date might not be filterable
    if (options.startDate && options.endDate) {
      // Convert to ISO datetime format as per PC docs
      const startDateTime = `${options.startDate}T00:00:00Z`;
      const endDateTime = `${options.endDate}T23:59:59Z`;
      
      // Try created_at instead of sort_date - documentation examples use created_at
      params.append('where[created_at][gte]', startDateTime);
      params.append('where[created_at][lte]', endDateTime);
      console.log('Added where date filters with created_at - gte:', startDateTime, 'lte:', endDateTime);
    } else if (options.startDate) {
      const startDateTime = `${options.startDate}T00:00:00Z`;
      params.append('where[created_at][gte]', startDateTime);
      console.log('Added startDate where filter with created_at:', startDateTime);
    } else if (options.endDate) {
      const endDateTime = `${options.endDate}T23:59:59Z`;
      params.append('where[created_at][lte]', endDateTime);
      console.log('Added endDate where filter with created_at:', endDateTime);
    }
    
    // Include related resources per PC JSON-API format
    params.append('include', 'items,team_members');
    params.append('per_page', '100');
    
    const finalUrl = `/services/v2/service_types/${serviceTypeId}/plans?${params}`;
    console.log('Final API URL:', finalUrl);
    
    const result = await this.paginate(finalUrl);
    cache.set(cacheKey, result, 900); // Cache for 15 minutes
    
    return result;
  }

  // Get plan items (songs) with notes
  async getPlanItems(planId) {
    const cacheKey = `plan_items_${planId}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      console.log('Returning cached plan items');
      return cached;
    }

    const params = new URLSearchParams({
      'include': 'item_notes',
      'where[item_type]': 'song',
      'per_page': '100'
    });
    
    const result = await this.request(`/services/v2/plans/${planId}/items?${params}`);
    cache.set(cacheKey, result, 1800); // Cache for 30 minutes
    
    return result;
  }

  // Get current user info
  async getCurrentUser() {
    const cacheKey = `user_${this.token.substring(0, 8)}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const result = await this.request('/people/v2/me');
    cache.set(cacheKey, result, 3600); // Cache for 1 hour
    
    return result;
  }

  // Handle pagination per PC API standards
  async paginate(endpoint) {
    let allData = [];
    let allIncluded = [];
    let nextUrl = endpoint;
    let totalRequests = 0;
    const maxRequests = 50; // Safety limit
    
    console.log(`Starting pagination for: ${endpoint}`);
    
    while (nextUrl && totalRequests < maxRequests) {
      const response = await this.request(nextUrl.replace(this.baseURL, ''));
      
      if (response.data) {
        allData = allData.concat(response.data);
      }
      
      // Collect included resources (team_members, items, notes, etc.)
      if (response.included) {
        console.log(`Found ${response.included.length} included resources in request ${totalRequests + 1}`);
        allIncluded = allIncluded.concat(response.included);
      } else {
        console.log(`No included resources in request ${totalRequests + 1}`);
      }
      
      // Get next page URL from links
      nextUrl = response.links?.next;
      totalRequests++;
      
      console.log(`Paginated request ${totalRequests}, got ${response.data?.length || 0} items`);
      
      // Small delay to be respectful to API
      if (nextUrl) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`Pagination complete. Total items: ${allData.length}, Total included: ${allIncluded.length}`);
    
    // Return JSON-API compliant structure
    return { 
      data: allData,
      included: allIncluded,
      meta: {
        total_count: allData.length,
        included_count: allIncluded.length,
        requests_made: totalRequests
      }
    };
  }
}

class PlanningCenterError extends Error {
  constructor(errorData, status) {
    const message = errorData.errors?.[0]?.detail || 
                   errorData.message || 
                   'Planning Center API Error';
    
    super(message);
    this.name = 'PlanningCenterError';
    this.status = status;
    this.errors = errorData.errors || [];
  }
}

// Factory function to create API instance with user's token
function createPCAPI(user) {
  if (!user || !user.accessToken) {
    throw new Error('User access token is required');
  }
  
  return new PlanningCenterAPI(user.accessToken);
}

module.exports = {
  PlanningCenterAPI,
  PlanningCenterError,
  createPCAPI
};
