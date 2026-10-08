import api from './api';

export const getEventTickets = (eventId) => api.get(`/events/${eventId}/tickets`).then((response) => response.data);
export const getTicket = (ticketId) => api.get(`/tickets/${ticketId}`).then((response) => response.data);
export const createTicket = (eventId, data) => api.post(`/events/${eventId}/tickets`, data).then((response) => response.data);
export const updateTicket = (ticketId, data) => api.put(`/tickets/${ticketId}`, data).then((response) => response.data);
export const deleteTicket = (ticketId) => api.delete(`/tickets/${ticketId}`).then((response) => response.data);

export const getEventRegistrations = (eventId, params = {}) => api.get(`/events/${eventId}/registrations`, { params }).then((response) => response.data);
export const getMyRegistrations = (params = {}) => api.get('/registrations', { params }).then((response) => response.data);
export const getRegistration = (registrationId) => api.get(`/registrations/${registrationId}`).then((response) => response.data);
export const createRegistration = (eventId, data) => api.post(`/events/${eventId}/registrations`, data).then((response) => response.data);
export const updateRegistration = (registrationId, data) => api.put(`/registrations/${registrationId}`, data).then((response) => response.data);
export const approveRegistration = (registrationId) => api.post(`/registrations/${registrationId}/approve`).then((response) => response.data);
export const cancelRegistration = (registrationId) => api.post(`/registrations/${registrationId}/cancel`).then((response) => response.data);

export const getEventCoupons = (eventId) => api.get(`/events/${eventId}/coupons`).then((response) => response.data);
export const getCoupon = (couponId) => api.get(`/coupons/${couponId}`).then((response) => response.data);
export const createCoupon = (eventId, data) => api.post(`/events/${eventId}/coupons`, data).then((response) => response.data);
export const updateCoupon = (couponId, data) => api.put(`/coupons/${couponId}`, data).then((response) => response.data);
export const deleteCoupon = (couponId) => api.delete(`/coupons/${couponId}`).then((response) => response.data);
