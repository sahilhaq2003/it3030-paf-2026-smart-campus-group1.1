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
  
  // 1. Fetch Paginated facilities 
  // params: { page: 0, size: 10, sort: 'name,asc' }
  getAllFacilities: async (params) => {
    try {
      const response = await axiosInstance.get('/facilities', { params });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // 2. Search Facilities (Dynamic Querying)
  // params: { type, capacity, location, status, page, size }
  searchFacilities: async (params) => {
    try {
      const response = await axiosInstance.get('/facilities/search', { params });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // 3. Get single Facility securely
  getFacilityById: async (id) => {
    try {
      const response = await axiosInstance.get(`/facilities/${id}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // (Optional Helper) Fetch enums for select box dropdowns (ROOM, LAB, etc.)
  getFacilityTypes: async () => {
    try {
      const response = await axiosInstance.get('/facilities/types');
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // 4. Create new Facility [ADMIN REQUIRED]
  // data: Request Payload DTO
  createFacility: async (data) => {
    try {
      const response = await axiosInstance.post('/facilities', data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // 5. Update entire Facility [ADMIN REQUIRED]
  // data: Request Payload DTO
  updateFacility: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/facilities/${id}`, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // 6. Patch specific Facility status safely [ADMIN REQUIRED]
  // Translates status correctly into the FacilityStatusUpdateDto expected by Spring
  updateFacilityStatus: async (id, status) => {
    try {
      const response = await axiosInstance.patch(`/facilities/${id}/status`, { status });
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // 7. Erase Facility safely (intercepted if booked) [ADMIN REQUIRED]
  deleteFacility: async (id) => {
    try {
      const response = await axiosInstance.delete(`/facilities/${id}`);
      return response.data; // Mostly returns empty based on 204 No Content
    } catch (error) {
      handleApiError(error);
    }
  }

};
