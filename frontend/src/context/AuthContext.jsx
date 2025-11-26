import { createContext, useContext, useState, useEffect } from "react";
import { authAPI, getToken, removeToken } from "../services/api";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await authAPI.getMe();
      setUser(data.user);
    } catch (error) {
      console.error("Auth check failed:", error);
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    if (data.user) {
      setUser(data.user);
    }
    return data;
  };

  const register = async (email, password, name) => {
    const data = await authAPI.register(email, password, name);
    if (data.user) {
      setUser(data.user);
    }
    return data;
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>);
};
