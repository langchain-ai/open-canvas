import { createSupabaseClient } from "@/lib/supabase";
import React, { createContext, useState, useEffect, useContext } from "react";
import {
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials,
  User,
} from "@supabase/supabase-js";

interface AuthContextType {
  signUp: (data: SignUpWithPasswordCredentials) => Promise<any>;
  signIn: (data: SignInWithPasswordCredentials) => Promise<any>;
  signOut: () => Promise<any>;
  user: User | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createSupabaseClient();
  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSupabaseUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user);
      setLoading(false);
    };

    getSupabaseUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user);
        setLoading(false);
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const value = {
    signUp: (data: SignUpWithPasswordCredentials) => supabase.auth.signUp(data),
    signIn: (data: SignInWithPasswordCredentials) =>
      supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
