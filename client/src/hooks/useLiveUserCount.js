import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function useLiveUserCount() {
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace("/api/v1/wiki", "")
      : "http://localhost:3000";

    const socket = io(backendUrl);

    socket.on("update_user_count", (count) => {
      setUserCount(count);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return userCount;
}
