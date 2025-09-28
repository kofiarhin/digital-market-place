import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("dm_token") || "");
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("dm_user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("dm_token", token);
    } else {
      localStorage.removeItem("dm_token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("dm_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("dm_user");
    }
  }, [user]);

  const login = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = () => {
    setToken("");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      logout,
      isAuthenticated: Boolean(token)
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
};
