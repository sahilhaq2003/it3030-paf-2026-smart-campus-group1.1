import axiosInstance from './axiosInstance';

// Create a new booking
export const createBooking = (bookingData) =>
  axiosInstance.post('/api/bookings', bookingData);

// Get my bookings
export const getMyBookings = () =>
  axiosInstance.get('/api/bookings/my');

// Get all bookings (admin)
export const getAllBookings = () =>
  axiosInstance.get('/api/bookings');

// Get single booking
export const getBookingById = (id) =>
  axiosInstance.get(`/api/bookings/${id}`);

// Check availability
export const checkAvailability = (facilityId, date, startTime, endTime) =>
  axiosInstance.get('/api/bookings/availability', {
    params: { facilityId, date, startTime, endTime }
  });

// Approve booking (admin)
export const approveBooking = (id) =>
  axiosInstance.patch(`/api/bookings/${id}/approve`);

// Reject booking (admin)
export const rejectBooking = (id, rejectionReason) =>
  axiosInstance.patch(`/api/bookings/${id}/reject`, { rejectionReason });

// Cancel booking
export const cancelBooking = (id) =>
  axiosInstance.patch(`/api/bookings/${id}/cancel`);

// Delete booking (admin)
export const deleteBooking = (id) =>
  axiosInstance.delete(`/api/bookings/${id}`);