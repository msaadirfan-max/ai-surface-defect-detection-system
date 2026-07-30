import axios from "axios";
import { toast } from "react-hot-toast";

const baseUrl = import.meta.env.VITE_API_URL;

//Creating a custom api instance
const apiClient = axios.create({
  baseURL: baseUrl,
  headers: {
    // Sending and Receiving JSON data from the backend
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

//Request interceptor to add the token to the request headers
apiClient.interceptors.request.use(
  // Config is used to modify the request before it is sent. Here, we are adding the Authorization header with the token from localStorage if it exists.
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.warn("No token found in localStorage.");
    }
    return config;
  },
  (error) => {
    console.error("Error in request:", error);
    toast.error("An error occurred while sending the request.");
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized error (e.g., redirect to login page)
      console.error("Unauthorized access - redirecting to login.");
      toast.error("An error occurred while processing the response.");
      localStorage.removeItem("token"); // Clear the token from localStorage
      window.location.href = "/login"; // Redirect to login page
    }

    return Promise.reject(error);
  },
);

export default apiClient;
