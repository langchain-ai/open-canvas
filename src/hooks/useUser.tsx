import { useEffect, useState } from "react";
import { getCookie, setCookie } from "@/lib/cookies";
import { USER_ID_COOKIE } from "@/constants";
import { v4 as uuidv4 } from "uuid";

export function useUser() {
  const [userId, setUserId] = useState<string | undefined>(() => {
    if (typeof window !== "undefined") {
      return getCookie(USER_ID_COOKIE);
    }
    return undefined;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!userId) {
      const newUserId = uuidv4();
      setCookie(USER_ID_COOKIE, newUserId);
      setUserId(newUserId);
    } else if (!getCookie(USER_ID_COOKIE)) {
      setCookie(USER_ID_COOKIE, userId);
    }
  }, [userId]);

  return {
    userId,
  };
}
