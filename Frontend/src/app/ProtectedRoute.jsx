import { Navigate, Outlet } from "react-router";
import { useSelector } from "react-redux";

/**
 * ProtectedRoute
 *
 * Props:
 *   role  — optional. If provided, user must also have this role.
 *           Otherwise any authenticated user is allowed.
 *
 * Usage:
 *   <Route element={<ProtectedRoute />}>          ← any logged-in user
 *   <Route element={<ProtectedRoute role="seller" />}>  ← sellers only
 *   <Route element={<ProtectedRoute role="buyer" />}>   ← buyers only
 */
export default function ProtectedRoute({ role }) {
  const { isAuth, user, isLoading } = useSelector((state) => state.auth);

  // While we don't yet know auth state (e.g. store hydrating), render nothing
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#111111" }}
      >
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "#f5c518", letterSpacing: "0.18em" }}
        >
          Loading…
        </span>
      </div>
    );
  }

  // Not authenticated → send to login
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role → send to their home
  if (role && user?.role !== role) {
    return <Navigate to={user?.role === "seller" ? "/seller/dashboard" : "/homepage"} replace />;
  }

  return <Outlet />;
}

/**
 * PublicBuyerRoute
 *
 * For public store and buyer-facing pages:
 * If a seller is logged in, they are NOT allowed on buyer/marketplace pages.
 * They are automatically redirected to /seller/dashboard.
 */
export function PublicBuyerRoute() {
  const { isAuth, user, isLoading } = useSelector((state) => state.auth);

  if (isLoading) {
    return null;
  }

  if (isAuth && user?.role === "seller") {
    return <Navigate to="/seller/dashboard" replace />;
  }

  return <Outlet />;
}

/**
 * AuthRoute
 *
 * For /login and /register pages:
 * If user is already authenticated:
 *   - sellers go to /seller/dashboard
 *   - buyers go to /homepage
 */
export function AuthRoute() {
  const { isAuth, user, isLoading } = useSelector((state) => state.auth);

  if (isLoading) {
    return null;
  }

  if (isAuth) {
    return <Navigate to={user?.role === "seller" ? "/seller/dashboard" : "/homepage"} replace />;
  }

  return <Outlet />;
}

