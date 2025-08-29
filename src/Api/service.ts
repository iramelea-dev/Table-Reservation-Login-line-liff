import { api } from "./action";

export const memberService = {
  createMember: (data: any) =>
    api.post("/members", data),
};

export const checkService = {
  register: (data: any) => api.post("/do/d1", data),
  checkLineid: (usersid: string) =>
    api.post("/do/check", { lineid: usersid }),
};