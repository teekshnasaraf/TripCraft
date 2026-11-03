import axios from "axios";
import {
  authExpiredEvent,
  clearAccessToken,
  getAccessToken,
} from "../features/auth/services/authToken";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10_000,
});

apiClient.interceptors.request.use((request) => {
  const token = getAccessToken();
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  return request;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== "undefined"
    ) {
      clearAccessToken();
      window.dispatchEvent(new Event(authExpiredEvent));
    }

    return Promise.reject(error);
  },
);
