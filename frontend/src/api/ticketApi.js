import axiosInstance from './axiosInstance';

export const ticketApi = {
  // Tickets
  getMyTickets: (params) => axiosInstance.get('/tickets/my', { params }),
  getAllTickets: (params) => axiosInstance.get('/tickets', { params }),
  getTicketById: (id) => axiosInstance.get(`/tickets/${id}`),
  getAssignedTickets: (params) => axiosInstance.get('/tickets/assigned', { params }),

  /** Pass a browser FormData (ticket JSON part + optional files). Do not set Content-Type — boundary is required. */
  createTicket: (formData) => axiosInstance.post('/tickets', formData),

  updateStatus: (id, data) => axiosInstance.patch(`/tickets/${id}/status`, data),
  closeTicket: (id) => axiosInstance.post(`/tickets/${id}/close`),
  assignTechnician: (id, technicianId) =>
    axiosInstance.patch(`/tickets/${id}/assign`, null, { params: { technicianId } }),
  deleteTicket: (id) => axiosInstance.delete(`/tickets/${id}`),

  // Attachments
  getAttachmentUrl: (ticketId, filename) =>
    `${axiosInstance.defaults.baseURL}/tickets/${ticketId}/attachments/${filename}`,

  // Comments
  getComments: (ticketId) => axiosInstance.get(`/tickets/${ticketId}/comments`),
  addComment: (ticketId, content) =>
    axiosInstance.post(`/tickets/${ticketId}/comments`, { content }),
  editComment: (ticketId, commentId, content) =>
    axiosInstance.put(`/tickets/${ticketId}/comments/${commentId}`, { content }),
  deleteComment: (ticketId, commentId) =>
    axiosInstance.delete(`/tickets/${ticketId}/comments/${commentId}`),

  // Analytics
  getTechnicianPerformance: () => axiosInstance.get('/tickets/analytics/technician-performance'),
};