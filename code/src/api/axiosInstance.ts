import axios from "axios";

const axiosInstance = axios.create({
  // baseURL: "https://krahejabackend.onrender.com/api",
  // baseURL: "http://103.133.214.185:5001/api",
  baseURL:" https://api.krpune1.futeservices.in/api",
  timeout: 10000, 
});

// Optional: interceptors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default axiosInstance;