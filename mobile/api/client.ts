import axios from "axios";
import * as SecureStore from "expo-secure-store";
import {storage} from "../utils/storage";

const baseURL = process.env.EXPO_PUBLIC_API_URL;

const apiClient = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
})

apiClient.interceptors.request.use(
   async (config) => {
        const token = await storage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error("Error in request interceptor:", error);
        return Promise.reject(error);
    }
)

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        if (error.response && error.response.status === 401) {
            console.error("Unauthorized access - redirecting to login.");
            await storage.deleteItem("token");
            await storage.deleteItem("user");
        }
        return Promise.reject(error);
    }
)

export default apiClient;