// Data transformation utilities for Planning Center data

/**
 * Transform Planning Center JSON-API response to simpler format
 * @param {object} pcResponse - Planning Center API response
 * @returns {object} Simplified response
 */
function simplifyPCResponse(pcResponse) {
  if (!pcResponse || !pcResponse.data) {
    return { data: [], included: [], meta: {} };
  }

  return {
    data: Array.isArray(pcResponse.data) ? pcResponse.data : [pcResponse.data],
    included: pcResponse.included || [],
    meta: pcResponse.meta || {},
    links: pcResponse.links || {}
  };
}

/**
 * Extract attributes from Planning Center resource
 * @param {object} resource - PC resource object
 * @returns {object} Resource attributes with id and type
 */
function extractResourceData(resource) {
  if (!resource) return null;

  return {
    id: resource.id,
    type: resource.type,
    ...resource.attributes
  };
}

/**
 * Find included resource by type and id
 * @param {array} included - Array of included resources
 * @param {string} type - Resource type
 * @param {string} id - Resource id
 * @returns {object|null} Found resource or null
 */
function findIncludedResource(included, type, id) {
  if (!included || !Array.isArray(included)) return null;
  
  return included.find(resource => 
    resource.type === type && resource.id === id
  );
}

/**
 * Extract related resources from relationships
 * @param {object} resource - Main resource
 * @param {array} included - Included resources
 * @param {string} relationshipName - Name of relationship
 * @returns {array} Array of related resources
 */
function extractRelatedResources(resource, included, relationshipName) {
  if (!resource.relationships || !resource.relationships[relationshipName]) {
    return [];
  }

  const relationshipData = resource.relationships[relationshipName].data;
  if (!relationshipData) return [];

  const relatedIds = Array.isArray(relationshipData) 
    ? relationshipData 
    : [relationshipData];

  return relatedIds
    .map(rel => findIncludedResource(included, rel.type, rel.id))
    .filter(Boolean);
}

/**
 * Transform service type data
 * @param {object} serviceType - Service type resource
 * @returns {object} Transformed service type
 */
function transformServiceType(serviceType) {
  return {
    id: serviceType.id,
    name: serviceType.attributes.name,
    frequency: serviceType.attributes.frequency,
    sequence: serviceType.attributes.sequence
  };
}

/**
 * Transform plan data with related resources
 * @param {object} plan - Plan resource
 * @param {array} included - Included resources
 * @returns {object} Transformed plan
 */
function transformPlan(plan, included) {
  const items = extractRelatedResources(plan, included, 'items');
  const teamMembers = extractRelatedResources(plan, included, 'team_members');

  return {
    id: plan.id,
    title: plan.attributes.title,
    sortDate: plan.attributes.sort_date,
    createdAt: plan.attributes.created_at,
    updatedAt: plan.attributes.updated_at,
    items: items.map(item => transformItem(item, included)),
    teamMembers: teamMembers.map(tm => extractResourceData(tm)),
    url: `https://services.planningcenteronline.com/plans/${plan.id}`
  };
}

/**
 * Transform item (song) data with notes
 * @param {object} item - Item resource
 * @param {array} included - Included resources
 * @returns {object} Transformed item
 */
function transformItem(item, included) {
  const notes = extractRelatedResources(item, included, 'notes');

  return {
    id: item.id,
    title: item.attributes.title,
    itemType: item.attributes.item_type,
    sequence: item.attributes.sequence,
    notes: notes.map(note => ({
      id: note.id,
      categoryName: note.attributes.category_name,
      note: note.attributes.note,
      createdAt: note.attributes.created_at
    }))
  };
}

/**
 * Sanitize search query
 * @param {string} query - Search query
 * @returns {string} Sanitized query
 */
function sanitizeSearchQuery(query) {
  if (!query || typeof query !== 'string') return '';
  
  return query
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 100); // Limit length
}

/**
 * Normalize singer name for comparison
 * @param {string} name - Singer name
 * @returns {string} Normalized name
 */
function normalizeSingerName(name) {
  if (!name || typeof name !== 'string') return '';
  
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Create pagination metadata
 * @param {object} response - API response with links
 * @param {number} currentPage - Current page number
 * @param {number} perPage - Items per page
 * @returns {object} Pagination metadata
 */
function createPaginationMeta(response, currentPage = 1, perPage = 25) {
  const meta = response.meta || {};
  const links = response.links || {};
  
  const totalCount = meta.total_count || 0;
  const totalPages = Math.ceil(totalCount / perPage);
  
  return {
    currentPage,
    perPage,
    totalCount,
    totalPages,
    hasNext: !!links.next,
    hasPrev: !!links.prev,
    nextUrl: links.next,
    prevUrl: links.prev
  };
}

/**
 * Validate Planning Center webhook payload
 * @param {object} payload - Webhook payload
 * @returns {boolean} True if valid
 */
function validateWebhookPayload(payload) {
  return (
    payload &&
    typeof payload === 'object' &&
    payload.data &&
    payload.data.type &&
    payload.data.id
  );
}

module.exports = {
  simplifyPCResponse,
  extractResourceData,
  findIncludedResource,
  extractRelatedResources,
  transformServiceType,
  transformPlan,
  transformItem,
  sanitizeSearchQuery,
  normalizeSingerName,
  createPaginationMeta,
  validateWebhookPayload
};
