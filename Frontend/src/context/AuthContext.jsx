import { createContext, useState, useEffect, useContext } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // App load hote hi check karo ki user pehle se logged in hai ya nahi
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.user);
      } catch (err) {
        setUser(null); // Agar error aaya (401), matlab logged in nahi hai
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // update user profile data changes
  const updateUser = (updatedUserData) => {
    setUser((prevUser) => ({
      ...prevUser,
      ...updatedUserData,
    }));
  };

  // Login function
  const login = async (email, password, rememberMe) => {
    const res = await api.post("/auth/login", { email, password, rememberMe });
    setUser(res.data.user);
    return res.data;
  };

  // Send OTP Function
  const sendOTP = async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
    return res.data;
  };

  // Verify OTP Function
  const verifyOTP = async (email, otp) => {
    const res = await api.post("/auth/verify-otp", { email, otp });
    setUser(res.data.user); // Login successful, user state set karo
    return res.data;
  };

  // Logout function
  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };

  // Forgot Password
  const forgotPassword = async (email) => {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
  };

  // Verify Reset OTP
  const verifyResetOTP = async (email, otp) => {
    const res = await api.post("/auth/verify-reset-otp", { email, otp });
    return res.data;
  };

  // Reset Password
  const resetPassword = async (email, newPassword) => {
    const res = await api.post("/auth/reset-password", { email, newPassword });
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        updateUser,
        login,
        sendOTP,
        verifyOTP,
        logout,
        forgotPassword,
        verifyResetOTP,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook taaki har jagah useContext(AuthContext) na likhna pade
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
