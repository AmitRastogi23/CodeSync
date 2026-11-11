import axios from "axios";

// Ek custom axios instance banaya
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

export default api;
