import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:1122"
});

// Set to Spring Boot
export const register = async (data: any) => {
  return await api.post("/do/d1", data, {
    headers: {
      "Content-Type": "application/json"
      //  Authorization: `Bearer ${token}`
    }
  });
};
