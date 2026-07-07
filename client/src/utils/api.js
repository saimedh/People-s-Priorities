import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Stats ────────────────────────────────────────────────────────────────────
export const getStats = () => api.get('/stats').then((r) => r.data);

// ─── Projects ─────────────────────────────────────────────────────────────────
export const getRankedProjects = (wardId = 'all') =>
  api.get(`/projects/${wardId}/rank`).then((r) => r.data);

export const compareProjects = (ids) =>
  api.get(`/projects/compare?ids=${ids.join(',')}`).then((r) => r.data);

// ─── Hotspots ─────────────────────────────────────────────────────────────────
export const getHotspots = (wardId = 'all') =>
  api.get(`/hotspots/${wardId}`).then((r) => r.data);

// ─── Submissions ──────────────────────────────────────────────────────────────
export const submitCitizenForm = async (formData) => {
  // If formData is plain object (legacy code), convert it, else use as is
  let payload = formData;
  if (!(formData instanceof FormData)) {
    payload = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== undefined) payload.append(key, formData[key]);
    });
  }
  const response = await api.post('/submissions', payload, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getSubmissions = (wardId) =>
  api.get('/submissions', { params: wardId ? { ward_id: wardId } : {} }).then((r) => r.data);

// ─── AI Summarize ─────────────────────────────────────────────────────────────
export const summarizeComplaints = (wardId) =>
  api.post('/summarize-complaints', wardId ? { ward_id: wardId } : {}).then((r) => r.data);

// ─── Wards ───────────────────────────────────────────────────────────────────
export const getWards = () => api.get('/wards').then((r) => r.data);

// ─── Local Pulse (News) ───────────────────────────────────────────────────────
export const getLocalPulse = (district, state) =>
  api.get(`/news/${district}?state=${state}`).then((r) => r.data);

export const refreshLocalPulse = (district, state) =>
  api.post('/news/refresh', { district, state }).then((r) => r.data);

// ─── TS vs AP Compare ────────────────────────────────────────────────────────
export const fetchStateCompare = (metric = 'enrollment') =>
  api.get(`/compare-states?metric=${metric}`).then((r) => r.data);

export const fetchStateDistricts = (state) =>
  api.get(`/compare-states/districts?state=${state}`).then((r) => r.data);

// ─── AI Chat (TinyFish + Gemini) ─────────────────────────────────────────────
export const sendChatMessage = (message, history = [], urls = []) =>
  api.post('/chat', { message, history, urls }).then((r) => r.data);

export default api;

