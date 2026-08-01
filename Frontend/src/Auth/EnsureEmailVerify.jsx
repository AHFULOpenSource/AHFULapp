import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { auth } from "../firebase.js";
import { GetFirebaseUser } from "./GetFirebaseUser.js";

/**
 * Blocks access unless user.email_verified === true
 */
export function RequireVerifiedEmail() {
  const { user, loading: authLoading } = GetFirebaseUser();
  const emailVerified = user?.emailVerified;

  // Still loading auth state (optional safety)
  if (!user) {
    return null; // or loading spinner
  }

  if (!emailVerified) {
    return <Navigate to="/NotVerified" replace />;
  }

  return <Outlet />;
}