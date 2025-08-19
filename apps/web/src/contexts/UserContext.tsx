import { createContext, useState, useEffect, ReactNode, useContext } from "react";

type UserContentType = {
  user: any | null;
  reflections: any[];
  customQuickActions: any[];
  updateReflections: (newRefs: any[]) => void;
};

const UserContext = createContext<UserContentType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [reflections, setReflections] = useState<any[]>([]);
  const [customQuickActions, setCustomQuickActions] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("oc_user_data");
    if (stored) {
      const data = JSON.parse(stored);
      setUser(data.user);
      setReflections(data.reflections || []);
      setCustomQuickActions(data.customQuickActions || []);
    } else {
      const dummyUser = { id: "local-user", email: "local@local.com" };
      setUser(dummyUser);
      localStorage.setItem("oc_user_data", JSON.stringify({ user: dummyUser, reflections: [], customQuickActions: [] }));
    }
  }, []);

  const updateReflections = (newRefs: any[]) => {
    setReflections(newRefs);
    const storedData = JSON.parse(localStorage.getItem("oc_user_data") || '{}');
    localStorage.setItem("oc_user_data", JSON.stringify({ ...storedData, reflections: newRefs }));
  };

  return (
    <UserContext.Provider value={{ user, reflections, customQuickActions, updateReflections }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
}
