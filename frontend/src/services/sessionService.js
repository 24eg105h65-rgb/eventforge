import api from './api';

export const getSessions = (eventId) => api.get(`/events/${eventId}/sessions`).then((response) => response.data);
export const getSession = (id) => api.get(`/sessions/${id}`).then((response) => response.data);
export const createSession = (eventId, data) => api.post(`/events/${eventId}/sessions`, data).then((response) => response.data);
export const updateSession = (id, data) => api.put(`/sessions/${id}`, data).then((response) => response.data);
export const deleteSession = (id) => api.delete(`/sessions/${id}`).then((response) => response.data);
export const getSchedule = (eventId, params = {}) => api.get(`/events/${eventId}/schedule`, { params }).then((response) => response.data);
