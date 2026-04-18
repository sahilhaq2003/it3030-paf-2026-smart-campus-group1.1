import axiosInstance from './axiosInstance';

// Create a new booking
export const createBooking = (bookingData) =>
  axiosInstance.post('/bookings', bookingData);

// Get my bookings
export const getMyBookings = () =>
  axiosInstance.get('/bookings/my');

// Get all bookings (admin)
export const getAllBookings = () =>
  axiosInstance.get('/bookings');

// Get single booking
export const getBookingById = (id) =>
  axiosInstance.get(`/bookings/${id}`);

// Check availability
export const checkAvailability = (facilityId, date, startTime, endTime, excludeBookingId = null) => {
  const params = { facilityId, date, startTime, endTime };
  if (excludeBookingId) params.excludeBookingId = excludeBookingId;
  return axiosInstance.get('/bookings/availability', { params });
};

// Approve booking (admin)
export const approveBooking = (id) =>
  axiosInstance.patch(`/bookings/${id}/approve`);

// Reject booking (admin)
export const rejectBooking = (id, rejectionReason) =>
  axiosInstance.patch(`/bookings/${id}/reject`, { bookingId: id, rejectionReason });



// Cancel booking
export const cancelBooking = (id) =>
  axiosInstance.patch(`/bookings/${id}/cancel`);

// Delete booking (admin)
export const deleteBooking = (id) =>
  axiosInstance.delete(`/bookings/${id}`);

// Update booking details
export const updateBooking = (id, bookingData) =>
  axiosInstance.put(`/bookings/${id}`, bookingData);

// Get analytics data (admin)
export const getBookingAnalytics = () =>
  axiosInstance.get('/bookings/analytics');