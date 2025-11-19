// action.ts
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API || "you localhost ";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  config.headers = config.headers || {};

  if (!config.headers["Content-Type"]) {
    Object.assign(config.headers, { "Content-Type": "application/json" });
  }

  if (token && !config.headers["Authorization"]) {
    Object.assign(config.headers, { Authorization: `Bearer ${token}` });
  }

  return config;
});
