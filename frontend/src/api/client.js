import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: BASE_URL });

export const smeApi = {
  register: (data) => api.post("/api/smes", data),
  list: (sector) => api.get("/api/smes", { params: sector ? { sector } : {} }),
  get: (id) => api.get(`/api/smes/${id}`),
};

export const needsApi = {
  publish: (data) => api.post("/api/needs", data),
  list: (status) => api.get("/api/needs", { params: status ? { status } : {} }),
  get: (id) => api.get(`/api/needs/${id}`),
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
