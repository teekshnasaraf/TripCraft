import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { apiClient } from "../../../services/apiClient";
import { getApiErrorMessage } from "../../../services/apiError";
import {
  authExpiredEvent,
  clearAccessToken,
  getAccessToken,
  storeAccessToken,
} from "../services/authToken";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
}

interface AuthApiUser {
  id: string;
  name: string;
  email: string;
}

interface AuthApiResponse {
  success: true;
  data: {
    user: AuthApiUser;
    token?: string;
  };
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

function toAuthUser(user: AuthApiUser): AuthUser {
  return {
    id: user.id,
    fullName: user.name,
    email: user.email,
  };
}

function getResponseUser(response: AuthApiResponse): AuthUser {
  return toAuthUser(response.data.user);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bootstrapRequest = useRef<Promise<AuthUser | null> | null>(null);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }

    const response = await apiClient.get<AuthApiResponse>("/auth/me");
    setUser(toAuthUser(response.data.data.user));
    setError(null);
  }, []);

  useEffect(() => {
    let active = true;

    const handleExpired = () => {
      setUser(null);
      setError("Your session has expired. Please sign in again.");
    };

    window.addEventListener(authExpiredEvent, handleExpired);

    const restoreSession = async () => {
      const token = getAccessToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (!bootstrapRequest.current) {
        bootstrapRequest.current = apiClient
          .get<AuthApiResponse>("/auth/me")
          .then((response) => toAuthUser(response.data.data.user))
          .catch((requestError: unknown) => {
            if (
              axios.isAxiosError(requestError) &&
              requestError.response?.status === 401
            ) {
              clearAccessToken();
            }
            throw requestError;
          });
      }

      try {
        const restoredUser = await bootstrapRequest.current;
        if (active) {
          setUser(restoredUser);
          setError(null);
        }
      } catch (requestError) {
        if (active) {
          setUser(null);
          setError(
            getApiErrorMessage(
              requestError,
              "Could not restore your session. Please try again.",
            ),
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void restoreSession();
    return () => {
      active = false;
      window.removeEventListener(authExpiredEvent, handleExpired);
    };
  }, []);

  const authenticate = useCallback(
    async (
      endpoint: "/auth/login" | "/auth/register",
      credentials: Record<string, string>,
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.post<AuthApiResponse>(
          endpoint,
          credentials,
        );
        const token = response.data.data.token;
        if (!token) {
          throw new Error("Authentication response did not contain a token.");
        }
        storeAccessToken(token);
        const authenticatedUser = getResponseUser(response.data);
        if (user && user.id !== authenticatedUser.id) {
          queryClient.removeQueries({ queryKey: ["trips"] });
        }
        setUser(authenticatedUser);
      } catch (requestError) {
        setUser(null);
        const message = getApiErrorMessage(
          requestError,
          "Authentication failed. Please try again.",
        );
        setError(message);
        throw new Error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [queryClient, user],
  );

  const login = useCallback(
    (email: string, password: string) =>
      authenticate("/auth/login", { email, password }),
    [authenticate],
  );

  const register = useCallback(
    (name: string, email: string, password: string) =>
      authenticate("/auth/register", { name, email, password }),
    [authenticate],
  );

  const logout = useCallback(async () => {
    clearAccessToken();
    queryClient.removeQueries({ queryKey: ["trips"] });
    setUser(null);
    setError(null);
  }, [queryClient]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
