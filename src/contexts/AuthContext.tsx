import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { message } from "antd";
import { authService } from "../services/authService";
import {
  getValidTokenFromStorage,
  setTokenInStorage,
  clearTokenFromStorage,
} from "../utils/tokenUtils";

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
    const token = getValidTokenFromStorage();
    if (token) {
      authService
        .validateToken(token)
        .then((userData) => {
          if (userData) {
            setUser(userData);
          } else {
            // Clear invalid token
            clearTokenFromStorage();
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Token validation failed:", error);
          // Clear invalid token
          clearTokenFromStorage();
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
      // STEP 1: LOGIN FIRST - GET THE TOKEN
      const response = await authService.login(credentials);
      if (response.success) {
        // STEP 2: STORE THE TOKEN
        const success = setTokenInStorage(
          response.token,
          credentials.rememberMe
        );
        if (!success) {
          throw new Error("Token storage failed");
        }

        // STEP 3: SET INITIAL USER DATA (from JWT)
        setUser(response.user);

        // STEP 4: NOW FETCH THE REAL PROFILE WITH THE TOKEN
        try {
          console.log("Fetching user profile after successful login...");
          const userProfile = await authService.getUserProfile(response.token);
          console.log("Profile loaded successfully:", userProfile.email);

          // Update user with real profile data
          setUser(userProfile);

          message.success("Login successful!");
          return true;
        } catch (profileError: any) {
          console.error("Failed to load profile after login:", profileError);
          // Login was successful, but profile loading failed
          // Keep the basic user data from JWT
          message.warning(
            "Login successful, but failed to load complete profile data."
          );
          return true;
        }
      }
      return false;
    } catch (error: any) {
      console.error("Login error:", error);

      // Clear any potentially corrupted tokens
      clearTokenFromStorage();

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
      } else if (
        error.message?.includes("PROFILE_FETCH_FAILED") ||
        error.message?.includes("Unable to load user profile")
      ) {
        message.error(
          "Login failed - Unable to load user profile. Please try again."
        );
      } else if (error.message === "Token storage failed") {
        message.error(
          "Login failed due to token storage issue. Please try again."
        );
      } else {
        message.error("Login failed. Please try again.");
      }
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    clearTokenFromStorage();
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
