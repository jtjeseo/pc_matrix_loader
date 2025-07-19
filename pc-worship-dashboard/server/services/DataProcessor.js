class DataProcessor {
  // Extract singer assignments from Planning Center JSON-API response
  static extractSingerAssignments(plansData) {
    const assignments = [];
    
    if (!plansData.data || !Array.isArray(plansData.data)) {
      console.warn('Invalid plans data structure');
      return assignments;
    }

    plansData.data.forEach(plan => {
      const planId = plan.id;
      const planDate = plan.attributes.sort_date;
      const planTitle = plan.attributes.title;
      
      // Find included items (songs) for this plan
      const planItemIds = plan.relationships?.items?.data?.map(item => item.id) || [];
      
      planItemIds.forEach(itemId => {
        // Find the item details in included resources
        const item = plansData.included?.find(inc => 
          inc.type === 'Item' && 
          inc.id === itemId && 
          inc.attributes.item_type === 'song'
        );
        
        if (!item) return;
        
        // Find notes for this item
        const noteIds = item.relationships?.notes?.data?.map(note => note.id) || [];
        
        noteIds.forEach(noteId => {
          const note = plansData.included?.find(inc => 
            inc.type === 'Note' && 
            inc.id === noteId &&
            (inc.attributes.category_name === 'Person' || 
             inc.attributes.category_name === 'Vocals')
          );
          
          if (!note || !note.attributes.note) return;
          
          // Extract and normalize singers from the note
          const singers = this.normalizeSingers(note.attributes.note);
          
          singers.forEach(singer => {
            assignments.push({
              singer: singer.trim(),
              song: item.attributes.title,
              date: planDate,
              planId: planId,
              planTitle: planTitle,
              noteCategory: note.attributes.category_name,
              originalNote: note.attributes.note
            });
          });
        });
      });
    });
    
    console.log(`Extracted ${assignments.length} singer assignments from ${plansData.data.length} plans`);
    return assignments;
  }

  // Extract singer assignments from direct plan items API response (current structure)
  static extractSingerAssignmentsFromPlanItems(planItemsData, planId, planDate, planTitle) {
    const assignments = [];
    
    if (!planItemsData.data || !Array.isArray(planItemsData.data)) {
      console.warn('Invalid plan items data structure');
      return assignments;
    }

    // Process each item in the plan
    planItemsData.data.forEach(item => {
      // Only process song items
      if (item.attributes.item_type !== 'song') return;

      // Get the item note IDs for this item
      const noteIds = item.relationships?.item_notes?.data?.map(note => note.id) || [];
      
      // Find the corresponding notes in included resources
      noteIds.forEach(noteId => {
        const note = planItemsData.included?.find(inc => 
          inc.type === 'ItemNote' && 
          inc.id === noteId &&
          (inc.attributes.category_name === 'Person' || 
           inc.attributes.category_name === 'Vocals')
        );
        
        if (!note || !note.attributes.content) return;
        
        // Extract and normalize singers from the note content
        const singers = this.normalizeSingers(note.attributes.content);
        console.log(`Found singer note: "${note.attributes.content}" -> normalized to:`, singers);
        
        singers.forEach(singer => {
          assignments.push({
            singer: singer.trim(),
            song: item.attributes.title,
            date: planDate,
            planId: planId,
            planTitle: planTitle,
            noteCategory: note.attributes.category_name,
            originalNote: note.attributes.content
          });
        });
      });
    });
    
    console.log(`Extracted ${assignments.length} singer assignments from plan ${planId} with ${planItemsData.data.length} items`);
    return assignments;
  }
  
  // Normalize singer names following existing liquid template logic
  static normalizeSingers(noteText) {
    if (!noteText || typeof noteText !== 'string') {
      return [];
    }
    
    // Follow existing liquid template logic:
    // Replace "/" and "&" with "+" to handle multiple singers
    return noteText
      .replace(/\//g, '+')
      .replace(/&/g, '+')
      .split('+')
      .map(s => s.trim())
      .filter(Boolean);
  }
  
  // Group assignments by singer (matching liquid template output)
  static groupBySinger(assignments) {
    const singerGroups = {};
    
    assignments.forEach(assignment => {
      const singer = assignment.singer;
      
      if (!singerGroups[singer]) {
        singerGroups[singer] = [];
      }
      
      singerGroups[singer].push(assignment);
    });
    
    // Sort singers alphabetically
    const sortedSingers = Object.keys(singerGroups).sort();
    
    // Sort each singer's assignments by date (newest first)
    sortedSingers.forEach(singer => {
      singerGroups[singer].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
    });
    
    return {
      singers: sortedSingers,
      assignments: singerGroups,
      totalSingers: sortedSingers.length,
      totalAssignments: assignments.length
    };
  }
  
  // Aggregate song frequency per singer (matching current report tools logic)
  static aggregateSongFrequency(singerAssignments) {
    const aggregated = {};
    
    Object.keys(singerAssignments).forEach(singer => {
      const assignments = singerAssignments[singer];
      const songGroups = {};
      
      // Group by song name
      assignments.forEach(assignment => {
        const songName = assignment.song;
        
        if (!songGroups[songName]) {
          songGroups[songName] = [];
        }
        
        songGroups[songName].push(assignment);
      });
      
      // Create aggregated entries with counts and latest dates
      const aggregatedSongs = Object.keys(songGroups).map(songName => {
        const group = songGroups[songName];
        const count = group.length;
        
        // Get latest date for sorting
        const latestDate = Math.max(...group.map(a => new Date(a.date).getTime()));
        
        return {
          singer: singer,
          song: songName,
          count: count,
          latestDate: new Date(latestDate),
          dates: group.map(a => a.date).sort((a, b) => new Date(b) - new Date(a)),
          planIds: group.map(a => a.planId),
          assignments: group
        };
      });
      
      // Sort by count (descending) then by latest date (descending)
      aggregatedSongs.sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return b.latestDate - a.latestDate;
      });
      
      aggregated[singer] = aggregatedSongs;
    });
    
    return aggregated;
  }
  
  // Calculate summary statistics
  static calculateSummaryStats(assignments) {
    const uniqueSongs = new Set(assignments.map(a => a.song));
    const uniqueSingers = new Set(assignments.map(a => a.singer));
    const uniquePlans = new Set(assignments.map(a => a.planId));
    const dateRange = this.getDateRange(assignments);
    
    // Calculate average singers per service
    const planSingerCounts = {};
    assignments.forEach(assignment => {
      if (!planSingerCounts[assignment.planId]) {
        planSingerCounts[assignment.planId] = new Set();
      }
      planSingerCounts[assignment.planId].add(assignment.singer);
    });
    
    const totalSingersAcrossAllPlans = Object.values(planSingerCounts).reduce(
      (sum, singers) => sum + singers.size, 0
    );
    const avgSingersPerService = uniquePlans.size > 0 ? totalSingersAcrossAllPlans / uniquePlans.size : 0;
    
    // Song frequency analysis
    const songCounts = {};
    assignments.forEach(assignment => {
      songCounts[assignment.song] = (songCounts[assignment.song] || 0) + 1;
    });
    
    const topSongs = Object.entries(songCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([song, count]) => ({ title: song, count })); // Use 'title' to match frontend
    
    return {
      // Frontend expects these property names
      totalServices: uniquePlans.size,
      activeSingers: uniqueSingers.size,
      uniqueSongs: uniqueSongs.size,
      avgSingersPerService: Math.round(avgSingersPerService * 10) / 10,
      
      // Additional data for other uses
      totalAssignments: assignments.length,
      dateRange,
      topSongs
    };
  }
  
  // Get date range from assignments
  static getDateRange(assignments) {
    if (assignments.length === 0) {
      return { start: null, end: null };
    }
    
    const dates = assignments.map(a => new Date(a.date));
    const start = new Date(Math.min(...dates));
    const end = new Date(Math.max(...dates));
    
    return { start, end };
  }
  
  // Filter assignments by date range
  static filterByDateRange(assignments, startDate, endDate) {
    return assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if (start && assignmentDate < start) return false;
      if (end && assignmentDate > end) return false;
      
      return true;
    });
  }
  
  // Search assignments by singer or song name
  static searchAssignments(assignments, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return assignments;
    }
    
    const term = searchTerm.toLowerCase().trim();
    
    return assignments.filter(assignment => 
      assignment.singer.toLowerCase().includes(term) ||
      assignment.song.toLowerCase().includes(term)
    );
  }
}

module.exports = DataProcessor;
