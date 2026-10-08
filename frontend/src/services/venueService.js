import api from './api';

export const getVenues = (eventId) => api.get(`/events/${eventId}/venues`).then((response) => response.data);
export const getVenue = (id) => api.get(`/venues/${id}`).then((response) => response.data);
export const createVenue = (eventId, data) => api.post(`/events/${eventId}/venues`, data).then((response) => response.data);
export const updateVenue = (id, data) => api.put(`/venues/${id}`, data).then((response) => response.data);
export const deleteVenue = (id) => api.delete(`/venues/${id}`).then((response) => response.data);
