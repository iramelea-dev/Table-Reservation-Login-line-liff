// action.ts
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API || "http://localhost:1122";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// ใส่ header กลาง ๆ ให้ทุก request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  // ให้แน่ใจว่า headers มีค่าเป็น object
  config.headers = config.headers || {};

  if (!config.headers["Content-Type"]) {
    Object.assign(config.headers, { "Content-Type": "application/json" });
  }

  if (token && !config.headers["Authorization"]) {
    Object.assign(config.headers, { Authorization: `Bearer ${token}` });
  }

  return config;
});
