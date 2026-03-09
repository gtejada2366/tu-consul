import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/auth-context";
import { Loading } from "./ui/loading";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate("/login", { replace: true });
    }
  }, [loading, session, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loading />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
