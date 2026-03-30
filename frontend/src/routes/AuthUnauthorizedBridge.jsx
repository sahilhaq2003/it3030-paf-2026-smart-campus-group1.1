import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { setUnauthorizedHandler } from "../api/unauthorizedSession";

/**
 * Wires axios 401 handling to {@link useAuth#logout} and a login redirect (must run under
 * {@link react-router-dom#BrowserRouter}).
 */
export default function AuthUnauthorizedBridge() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      navigate("/login", { replace: true });
    });
    return () => setUnauthorizedHandler(null);
  }, [logout, navigate]);

  return null;
}
