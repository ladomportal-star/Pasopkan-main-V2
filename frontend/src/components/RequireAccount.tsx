import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasAccountSession } from "../lib/authAccess";
import DotsLoader from "./DotsLoader";

export default function RequireAccount() {
  const { user, token, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="grid min-h-screen place-items-center" role="status"><DotsLoader /></div>;
  if (!hasAccountSession(user, token)) {
    return <Navigate to="/login" replace state={{
      returnTo: location.pathname + location.search + location.hash,
      returnState: location.state,
    }} />;
  }
  return <Outlet />;
}
