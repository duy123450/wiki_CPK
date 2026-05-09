import { useCallback, useEffect, useState } from "react";
import { AUTH_TOKEN_KEY, getCurrentUser } from "../services/api";

export default function useAuth() {
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    const restoreUser = async () => {
      const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return;
      try {
        const user = await getCurrentUser();
        setAuthUser(user);
      } catch {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    };
    restoreUser();
  }, []);

  // Called on login / register — response is { user, token }
  const handleAuthSuccess = useCallback(({ user, token, accessToken }) => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, accessToken || token);
    setAuthUser(user);
  }, []);

  // Called when only the avatar changes — no token resave needed
  const handleAvatarUpdate = useCallback((avatar) => {
    setAuthUser((prev) => (prev ? { ...prev, avatar } : prev));
  }, []);

  const handleLogout = useCallback(() => {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    setAuthUser(null);
  }, []);

  // Called when profile fields (username, email) are updated
  const handleProfileUpdate = useCallback((user, token) => {
    if (token) window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    setAuthUser(user);
  }, []);

  return {
    authUser,
    handleAuthSuccess,
    handleAvatarUpdate,
    handleLogout,
    handleProfileUpdate,
  };
}
