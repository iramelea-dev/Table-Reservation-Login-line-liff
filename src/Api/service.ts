import { api } from "./action";

export const register = (data: any) => {
  return api.post("/do/d1", data, {
    headers: { "Content-Type": "application/json" },
  });
};

export const createMember = (data: any) => {
  return api.post("/members", data, {
    headers: { "Content-Type": "application/json" },
  });
};