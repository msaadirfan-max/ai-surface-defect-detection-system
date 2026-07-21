import axios from "axios";

const baseUrl = import.meta.env.VITE_API_URL 

//Creating a custom api instance
const apiClient = axios.create({
  baseURL: baseUrl,
  headers: {
    "Content-Type": "application/json",
    'Accept': "application/json",
  },
});

//Request interceptor to add the token to the request headers
apiClient.interceptors.request.use(
    (config) =>{
        const token = localStorage.getItem("token");
        if(token){
            config.headers['Authorization'] = `Bearer ${token}`;
        }else{
            console.warn("No token found in localStorage.");
        }
        return config;
    },
    (error) => {
        console.error("Error in request:", error);
        return Promise.reject(error);
        
    }
);

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Handle unauthorized error (e.g., redirect to login page)
            console.error("Unauthorized access - redirecting to login.");
            localStorage.removeItem("token"); // Clear the token from localStorage
            window.location.href = "/login"; // Redirect to login page
        }


        return Promise.reject(error);
    }
);

export default apiClient;