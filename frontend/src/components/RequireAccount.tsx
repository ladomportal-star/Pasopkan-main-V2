import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasAccountSession } from "../lib/authAccess";
import DotsLoader from "./DotsLoader";

export default function RequireAccount() {
  const { user, token, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const allowed = hasAccountSession(user, token);
  // Redirect exactly once per location. Page transitions keep this route mounted
  // while it re-renders; a declarative <Navigate> would call history.replaceState
  // on every re-render, which iOS Safari aborts after 100 calls in 10 seconds.
  const redirectedFor = useRef<string | null>(null);

  useEffect(() => {
    if (loading || allowed) return;
    if (redirectedFor.current === location.key) return;
    redirectedFor.current = location.key;
    if (/^\/(login|register)\/?$/i.test(window.location.pathname)) return;
    navigate("/login", {
      replace: true,
      state: {
        returnTo: location.pathname + location.search + location.hash,
        returnState: location.state,
      },
    });
  }, [loading, allowed, location, navigate]);

  if (loading || !allowed) {
    return <div className="grid min-h-screen place-items-center" role="status"><DotsLoader /></div>;
  }
  return <Outlet />;
}
