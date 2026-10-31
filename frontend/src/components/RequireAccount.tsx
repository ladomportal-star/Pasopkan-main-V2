import { useMemo } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasAccountSession } from "../lib/authAccess";
import DotsLoader from "./DotsLoader";

export default function RequireAccount() {
  const { user, token, loading } = useAuth();
  const location = useLocation();
  // <Navigate> re-navigates whenever its `state` prop changes identity. While a
  // page transition keeps this route mounted, every re-render would otherwise
  // create a new state object and trigger another history.replaceState, which
  // iOS Safari aborts after 100 calls in 10 seconds. Keep it stable per location.
  const redirectState = useMemo(
    () => ({
      returnTo: location.pathname + location.search + location.hash,
      returnState: location.state,
    }),
    [location.key],
  );
  if (loading) return <div className="grid min-h-screen place-items-center" role="status"><DotsLoader /></div>;
  if (!hasAccountSession(user, token)) {
    return <Navigate to="/login" replace state={redirectState} />;
  }
  return <Outlet />;
}
