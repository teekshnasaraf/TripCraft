import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { LoadingSpinner } from "../../../components/common/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";

export function RequireAuth({ children }: PropsWithChildren) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingSpinner label="Checking your sign-in status" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/sign-in"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}
