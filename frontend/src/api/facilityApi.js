import axiosInstance from './axiosInstance';

/**
 * Standardized API error parser. 
 * Formatted specifically to unpack the 'message' payload sent by our Spring Boot GlobalExceptionHandler
 */
const handleApiError = (error) => {
  if (error.response && error.response.data) {
    const errorData = error.response.data;
    
    // Attempt extracting the global exception handler error message nicely
    if (errorData.message) {
      throw new Error(errorData.message);
    }
    
    // Validation errors (ex. from MethodArgumentNotValidException maps fieldErrors)
    if (errorData.errors && Object.keys(errorData.errors).length > 0) {
      const firstFieldErr = Object.values(errorData.errors)[0];
      throw new Error(`Validation failed: ${firstFieldErr}`);
    }

    // Fallback for basic HTTP status
    throw new Error(`API Error: ${error.response.statusText || error.response.status}`);
  }
  
  // Generic network errors (timeouts, CORS, server offline)
  throw new Error(error.message || 'A network error occurred connecting to the API');
};

export const facilityApi = {
  
  /**
   * Fetches a paginated list of facilities.
   * 
   * @param {Object} params - The pagination parameters.
   * @param {number} [params.page] - The page number to fetch (0-indexed).
   * @param {number} [params.size] - The number of items per page.
   * @param {string} [params.sort] - Sorting criteria (e.g., 'name,asc').
   * @returns {Promise<Object>} The paginated response data.
   */
  getAllFacilities: async (params) => {
    try {
      const response = await axiosInstance.get('/facilities', { params });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Searches for facilities based on various dynamic query filters.
   * 
   * @param {Object} params - Search filter parameters (type, capacity, location, status, page, size).
   * @returns {Promise<Object>} The paginated list of matching facilities.
   */
  searchFacilities: async (params) => {
    try {
      const response = await axiosInstance.get('/facilities/search', { params });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Retrieves a single facility securely by its ID.
   * 
   * @param {number|string} id - The unique ID of the facility.
   * @returns {Promise<Object>} The retrieved facility data.
   */
  getFacilityById: async (id) => {
    try {
      const response = await axiosInstance.get(`/facilities/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Fetches available facility resource types for dropdowns and filters.
   * 
   * @returns {Promise<Array>} A list of enum resource types (e.g., LECTURE_HALL, LAB).
   */
  getFacilityTypes: async () => {
    try {
      const response = await axiosInstance.get('/facilities/types');
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Creates a new facility. [ADMIN REQUIRED]
   * 
   * @param {Object} data - The facility DTO request payload.
   * @returns {Promise<Object>} The newly created facility.
   */
  createFacility: async (data) => {
    try {
      const response = await axiosInstance.post('/facilities', data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Updates an existing facility completely. [ADMIN REQUIRED]
   * 
   * @param {number|string} id - The ID of the facility to update.
   * @param {Object} data - The facility DTO request payload with updated fields.
   * @returns {Promise<Object>} The updated facility.
   */
  updateFacility: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/facilities/${id}`, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Patches the specific status of a facility safely. [ADMIN REQUIRED]
   * Translates status correctly into the FacilityStatusUpdateDto expected by the backend.
   * 
   * @param {number|string} id - The ID of the facility.
   * @param {string} status - The new status (ACTIVE, OUT_OF_SERVICE, UNDER_MAINTENANCE).
   * @returns {Promise<Object>} The updated facility data.
   */
  updateFacilityStatus: async (id, status) => {
    try {
      const response = await axiosInstance.patch(`/facilities/${id}/status`, { status });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Safely deletes a facility (intercepted if actively booked). [ADMIN REQUIRED]
   * 
   * @param {number|string} id - The ID of the facility to remove.
   * @returns {Promise<void>} Returns empty based on 204 No Content.
   */
  deleteFacility: async (id) => {
    try {
      const response = await axiosInstance.delete(`/facilities/${id}`);
      return response.data; // Mostly returns empty based on 204 No Content
    } catch (error) {
      handleApiError(error);
    }
  }

};
