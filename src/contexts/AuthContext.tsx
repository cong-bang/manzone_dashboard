import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { message } from "antd";
import { authService } from "../services/authService";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  phoneNumber?: string;
  address?: string;
  active?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      authService
        .validateToken(token)
        .then((userData) => {
          if (userData) {
            setUser(userData);
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => {
    try {
      const response = await authService.login(credentials);
      if (response.success) {
        setUser(response.user);

        const storage = credentials.rememberMe ? localStorage : sessionStorage;
        storage.setItem("token", response.token);

        message.success("Login successful!");
        return true;
      }
      return false;
    } catch (error: any) {
      if (error.message === "INSUFFICIENT_PERMISSIONS") {
        message.error(
          "Access denied. You don't have permission to access the admin dashboard."
        );
      } else if (error.message === "INVALID_CREDENTIALS") {
        message.error("Invalid email or password. Please try again.");
      } else if (error.message === "NETWORK_ERROR") {
        message.error(
          "Network error. Please check your connection and try again."
        );
      } else if (
        error.message === "UNAUTHORIZED" ||
        error.message === "FORBIDDEN"
      ) {
        message.error("Authentication failed. Please try logging in again.");
      } else if (error.message === "PROFILE_FETCH_FAILED") {
        message.warning("Login successful, but failed to load profile data.");
      } else {
        message.error("Login failed. Please try again.");
      }
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    message.success("Logged out successfully!");
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
