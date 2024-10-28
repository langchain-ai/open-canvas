export const isAuthEnabled = () => {
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && 
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  };