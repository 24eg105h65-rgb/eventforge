import api from './api';

export const getEvents = (params = {}) => api.get('/events', { params }).then((response) => response.data);
export const getEvent = (id) => api.get(`/events/${id}`).then((response) => response.data);
export const createEvent = (data) => api.post('/events', data).then((response) => response.data);
export const updateEvent = (id, data) => api.put(`/events/${id}`, data).then((response) => response.data);
export const deleteEvent = (id) => api.delete(`/events/${id}`).then((response) => response.data);
export const getEventOverview = (id) => api.get(`/events/${id}/overview`).then((response) => response.data);
