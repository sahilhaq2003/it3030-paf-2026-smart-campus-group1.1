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
export const checkAvailability = (facilityId, date, startTime, endTime) =>
  axiosInstance.get('/bookings/availability', {
    params: { facilityId, date, startTime, endTime }
  });

// Approve booking (admin)
export const approveBooking = (id) =>
  axiosInstance.patch(`/bookings/${id}/approve`);

// Reject booking (admin)
export const rejectBooking = (id, rejectionReason) =>
  axiosInstance.patch(`/bookings/${id}/reject`, { rejectionReason });

// Cancel booking
export const cancelBooking = (id) =>
  axiosInstance.patch(`/bookings/${id}/cancel`);

// Delete booking (admin)
export const deleteBooking = (id) =>
  axiosInstance.delete(`/bookings/${id}`);

// Update booking details
export const updateBooking = (id, bookingData) =>
  axiosInstance.put(`/bookings/${id}`, bookingData);
