import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: BASE_URL });

export const smeApi = {
  register: (data) => api.post("/api/smes", data),
  list: (params) => api.get("/api/smes", { params: params || {} }),
  get: (id) => api.get(`/api/smes/${id}`),
  update: (id, data) => api.put(`/api/smes/${id}`, data),
};

export const needsApi = {
  publish: (data) => api.post("/api/needs", data),
  list: (params) => api.get("/api/needs", { params: params || {} }),
  get: (id) => api.get(`/api/needs/${id}`),
  update: (id, data) => api.put(`/api/needs/${id}`, data),
};

export const matchingApi = {
  run: (need_id) => api.post("/api/matches/run", { need_id }),
  runForNeed: (need_id) => api.post(`/api/matches/run/${need_id}`),
  history: () => api.get("/api/matches"),
  gaps: () => api.get("/api/matches/gaps"),
};

export const applicationsApi = {
  create: (data) => api.post("/api/applications", data),
  list: (params) => api.get("/api/applications", { params: params || {} }),
  listMy: (sme_id) => api.get(`/api/applications/my/${sme_id}`),
  accept: (id) => api.post(`/api/applications/${id}/accept`),
  reject: (id) => api.post(`/api/applications/${id}/reject`),
};

export const notificationsApi = {
  forPme: (sme_id) => api.get(`/api/notifications/pme/${sme_id}`),
  forInvestisseur: () => api.get("/api/notifications/investisseur"),
  markRead: (id) => api.post(`/api/notifications/mark-read/${id}`),
  markAllRead: (body) => api.post("/api/notifications/mark-all-read", body),
};

export const chatApi = {
  send: (message, role) => api.post("/api/chat", { message, role }),
};

export const demoApi = {
  reset: () => api.post("/api/demo/reset"),
};

export const geographyApi = {
  regions: () => api.get("/api/regions"),
  ports: (region_id) =>
    api.get("/api/ports", { params: region_id ? { region_id } : {} }),
};
