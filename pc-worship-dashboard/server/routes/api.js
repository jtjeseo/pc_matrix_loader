const express = require('express');
const router = express.Router();
const { createPCAPI } = require('../services/PlanningCenterAPI');

// Proxy endpoint for Planning Center API requests
router.get('/pc/*', async (req, res, next) => {
  try {
    const pcApi = createPCAPI(req.user);
    const endpoint = req.originalUrl.replace('/api/pc', '');
    
    console.log(`Proxying PC API request: ${endpoint}`);
    
    const result = await pcApi.request(endpoint);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get service types
router.get('/service-types', async (req, res, next) => {
  try {
    const pcApi = createPCAPI(req.user);
    const serviceTypes = await pcApi.getServiceTypes();
    
    res.json({
      success: true,
      data: serviceTypes
    });
  } catch (error) {
    next(error);
  }
});

// Get plans for a service type with optional date filtering
router.get('/service-types/:id/plans', async (req, res, next) => {
  try {
    const pcApi = createPCAPI(req.user);
    const serviceTypeId = req.params.id;
    
    const options = {};
    if (req.query.start_date) {
      options.startDate = req.query.start_date;
    }
    if (req.query.end_date) {
      options.endDate = req.query.end_date;
    }
    
    console.log(`Getting plans for service type ${serviceTypeId} with options:`, options);
    
    const plans = await pcApi.getPlans(serviceTypeId, options);
    
    res.json({
      success: true,
      data: plans,
      meta: {
        service_type_id: serviceTypeId,
        filters: options
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get items for a specific plan
router.get('/plans/:id/items', async (req, res, next) => {
  try {
    const pcApi = createPCAPI(req.user);
    const planId = req.params.id;
    
    const items = await pcApi.getPlanItems(planId);
    
    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    next(error);
  }
});

// Get current user information
router.get('/me', async (req, res, next) => {
  try {
    const pcApi = createPCAPI(req.user);
    const user = await pcApi.getCurrentUser();
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Health check for API connectivity
router.get('/health', async (req, res, next) => {
  try {
    const pcApi = createPCAPI(req.user);
    
    // Test connectivity by getting user info
    await pcApi.getCurrentUser();
    
    res.json({
      success: true,
      message: 'Planning Center API connection healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Planning Center API connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
