import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/router";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth();
  const router = useRouter();

  if (!auth?.user) {
    router.push("/login");
    return null;
  }

  return children;
};

export default ProtectedRoute;
