import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:1122"
});

// Jwt

api.interceptors.request.use((config) => {
const t = localStorage.getItem("jwt_token");
if (t) {
config.headers = config.headers || {};
config.headers.Authorization = `Bearer ${t}`; // มาตรฐาน
(config.headers as any).token = t; 
}
return config;
});

// Spring Boot
export const register = async (data: any) => {
  return await api.post("/do/d1", data, {
    headers: {
      "Content-Type": "application/json"
      //  Authorization: `Bearer ${token}`
    }
  }).catch(error=>{
    console.log(error)
  });
};

export default api;
