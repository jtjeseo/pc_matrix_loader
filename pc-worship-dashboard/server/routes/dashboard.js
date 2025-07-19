const express = require('express');
const router = express.Router();
const { PlanningCenterAPI } = require('../services/PlanningCenterAPI');
const DataProcessor = require('../services/DataProcessor');

// Progress tracking
let progressState = {
  isProcessing: false,
  currentStep: '',
  totalPlans: 0,
  processedPlans: 0,
  percentage: 0,
  errors: []
};

// Progress endpoint
router.get('/progress', (req, res) => {
  res.json(progressState);
});

// Reset progress
function resetProgress() {
  progressState = {
    isProcessing: false,
    currentStep: '',
    totalPlans: 0,
    processedPlans: 0,
    percentage: 0,
    errors: []
  };
}

// Update progress
function updateProgress(step, processed = null, total = null, error = null) {
  progressState.currentStep = step;
  if (processed !== null) progressState.processedPlans = processed;
  if (total !== null) progressState.totalPlans = total;
  if (progressState.totalPlans > 0) {
    progressState.percentage = Math.round((progressState.processedPlans / progressState.totalPlans) * 100);
  }
  if (error) progressState.errors.push(error);
  console.log(`Progress: ${progressState.currentStep} (${progressState.processedPlans}/${progressState.totalPlans}) ${progressState.percentage}%`);
}

// Get dashboard data for a specific service type and date range
router.get('/data', async (req, res, next) => {
  try {
    resetProgress();
    progressState.isProcessing = true;
    updateProgress('Initializing Planning Center API...');
    
    const {
      startDate,
      endDate,
      search,
      singer_filter
    } = req.query;

    console.log('Dashboard data request:', {
      startDate,
      endDate,
      search,
      singer_filter
    });
    
    console.log('Date values and types:', {
      startDate: { value: startDate, type: typeof startDate },
      endDate: { value: endDate, type: typeof endDate }
    });

    const pcApi = new PlanningCenterAPI();
    pcApi.setTokenFromSession(req.session);
    
    updateProgress('Fetching service types...');
    // First get all service types
    const serviceTypesResponse = await pcApi.getServiceTypes();
    console.log('Service types response:', JSON.stringify(serviceTypesResponse, null, 2));
    const serviceTypes = serviceTypesResponse.data || [];
    console.log(`Found ${serviceTypes.length} service types`);
    
    let allAssignments = [];
    let totalPlans = 0;
    let processedPlans = 0;
    
    // First pass: count total plans
    updateProgress('Counting total plans...');
    for (const serviceType of serviceTypes) {
      try {
        const options = {};
        if (startDate) options.startDate = startDate;
        if (endDate) options.endDate = endDate;
        
        const plansResponse = await pcApi.getPlans(serviceType.id, options);
        totalPlans += plansResponse.data?.length || 0;
      } catch (error) {
        console.error(`Error counting plans for service type ${serviceType.id}:`, error.message);
      }
    }
    
    updateProgress('Processing singer assignments...', 0, totalPlans);
    
    // Get plans for each service type
    for (const serviceType of serviceTypes) {
      try {
        console.log(`Fetching plans for service type: ${serviceType.attributes.name}`);
        
        const options = {};
        if (startDate) options.startDate = startDate;
        if (endDate) options.endDate = endDate;
        
        const plansResponse = await pcApi.getPlans(serviceType.id, options);
        console.log(`Found ${plansResponse.data?.length || 0} plans for ${serviceType.attributes.name}`);
        
        // Debug: Check the actual date range of returned plans
        if (plansResponse.data && plansResponse.data.length > 0) {
          // Show the structure of the first plan to identify correct date field
          console.log('Sample plan structure:', JSON.stringify(plansResponse.data[0], null, 2));
          
          const dates = plansResponse.data.map(plan => plan.attributes.sort_date).filter(Boolean).sort();
          console.log(`Date range of returned plans: ${dates[0]} to ${dates[dates.length - 1]}`);
          console.log(`Sample plan dates:`, dates.slice(0, 5), '...', dates.slice(-5));
        }
        
        console.log(`Included resources count: ${plansResponse.included?.length || 0}`);
        
        // Since bulk plans API doesn't include items/notes, we need to fetch individual plan items
        // Process all plans in the date range to get complete singer assignments
        if (plansResponse.data && plansResponse.data.length > 0) {
          // Sort plans by date (most recent first)
          const sortedPlans = plansResponse.data.sort((a, b) => 
            new Date(b.attributes.sort_date) - new Date(a.attributes.sort_date)
          );
          
          console.log(`Processing ${sortedPlans.length} plans for singer assignments...`);
          
          // Process each plan individually to get singer assignments
          // Note: This could be a lot of API calls, but it's necessary for complete data
          for (const plan of sortedPlans) {
            try {
              processedPlans++;
              updateProgress(`Processing ${plan.attributes.title || 'Untitled'}`, processedPlans, totalPlans);
              
              console.log(`Fetching items for plan ${plan.id} (${plan.attributes.title})...`);
              const planItems = await pcApi.getPlanItems(plan.id);
              
              // Extract singer assignments from this plan
              const planAssignments = DataProcessor.extractSingerAssignmentsFromPlanItems(
                planItems, 
                plan.id, 
                plan.attributes.sort_date, 
                plan.attributes.title
              );
              
              allAssignments.push(...planAssignments);
              console.log(`Added ${planAssignments.length} assignments from plan ${plan.attributes.title}`);
              
            } catch (itemError) {
              const errorMsg = `Error fetching items for plan ${plan.id}: ${itemError.message}`;
              console.error(errorMsg);
              updateProgress(progressState.currentStep, processedPlans, totalPlans, errorMsg);
            }
          }
        }
        
        console.log(`Extracted ${allAssignments.length} assignments from this service type`);
      } catch (error) {
        const errorMsg = `Error fetching plans for service type ${serviceType.id}: ${error.message}`;
        console.error(errorMsg);
        updateProgress(progressState.currentStep, processedPlans, totalPlans, errorMsg);
        // Continue with other service types
      }
    }
    
    updateProgress('Processing data and calculating statistics...');
    console.log(`Total assignments extracted: ${allAssignments.length}`);
    
    // Apply search filter if provided
    if (search) {
      allAssignments = DataProcessor.searchAssignments(allAssignments, search);
    }
    
    // Group by singer
    const groupedData = DataProcessor.groupBySinger(allAssignments);
    
    // Filter by specific singer if requested
    let filteredSingers = groupedData.singers;
    let filteredAssignments = groupedData.assignments;
    
    if (singer_filter && singer_filter.trim() !== '') {
      const targetSinger = singer_filter.toLowerCase().trim();
      filteredSingers = groupedData.singers.filter(singer => 
        singer.toLowerCase() === targetSinger
      );
      
      filteredAssignments = {};
      filteredSingers.forEach(singer => {
        filteredAssignments[singer] = groupedData.assignments[singer];
      });
    }
    
    // Aggregate song frequency data
    const aggregatedData = DataProcessor.aggregateSongFrequency(filteredAssignments);
    
    // Calculate summary statistics
    const summaryStats = DataProcessor.calculateSummaryStats(allAssignments);
    console.log('Summary stats calculated:', summaryStats);
    console.log('Grouped data summary:', {
      totalSingers: filteredSingers.length,
      totalAssignments: Object.values(filteredAssignments).reduce((sum, arr) => sum + arr.length, 0)
    });
    
    // Transform data for frontend components
    const singersForTable = filteredSingers.map(singer => {
      const assignments = filteredAssignments[singer] || [];
      const uniquePlans = new Set(assignments.map(a => a.planId));
      const uniqueSongs = new Set(assignments.map(a => a.song));
      
      return {
        name: singer,
        totalServices: uniquePlans.size,
        totalSongs: uniqueSongs.size,
        totalAssignments: assignments.length,
        assignments: assignments
      };
    });
    
    progressState.isProcessing = false;
    updateProgress('Complete!', totalPlans, totalPlans);
    
    res.json({
      success: true,
      data: {
        singers: singersForTable,
        songs: summaryStats.topSongs, // For SongFrequency component
        assignments: filteredAssignments,
        aggregated: aggregatedData,
        summary: summaryStats,
        filters: {
          service_types: serviceTypes.map(st => ({ id: st.id, name: st.attributes.name })),
          startDate,
          endDate,
          search,
          singer_filter,
          total_plans: allAssignments.length
        }
      }
    });
  } catch (error) {
    progressState.isProcessing = false;
    const errorMsg = `Dashboard data error: ${error.message}`;
    updateProgress('Error occurred', progressState.processedPlans, progressState.totalPlans, errorMsg);
    next(error);
  }
});

// Get summary statistics only (lighter endpoint)
router.get('/summary', async (req, res, next) => {
  try {
    const {
      service_type_id,
      start_date,
      end_date
    } = req.query;

    if (!service_type_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'service_type_id is required'
      });
    }

    const pcApi = createPCAPI(req.user);
    
    const options = {};
    if (start_date) options.startDate = start_date;
    if (end_date) options.endDate = end_date;
    
    const plansData = await pcApi.getPlans(service_type_id, options);
    const assignments = DataProcessor.extractSingerAssignments(plansData);
    const summaryStats = DataProcessor.calculateSummaryStats(assignments);
    
    res.json({
      success: true,
      data: summaryStats
    });
  } catch (error) {
    next(error);
  }
});

// Get list of all singers for dropdown
router.get('/singers', async (req, res, next) => {
  try {
    const { service_type_id } = req.query;

    if (!service_type_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'service_type_id is required'
      });
    }

    const pcApi = createPCAPI(req.user);
    
    // Get all plans for this service type (no date filter for complete singer list)
    const plansData = await pcApi.getPlans(service_type_id, {});
    const assignments = DataProcessor.extractSingerAssignments(plansData);
    const groupedData = DataProcessor.groupBySinger(assignments);
    
    res.json({
      success: true,
      data: {
        singers: groupedData.singers,
        count: groupedData.totalSingers
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
