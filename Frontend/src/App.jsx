import "./App.css";
import { useEffect, useState } from "react";
import { RouterProvider } from "react-router";
import { useDispatch } from "react-redux";
import { router } from "./app/app.routes.jsx";
import { login, setLoading } from "./feature/auth/state/auth.slice";
import { getMe } from "./feature/auth/services/auth.api";
import { fetchCart, syncCart } from "./feature/cart/state/cart.slice";

/**
 * AuthHydrator
 *
 * Runs once on app mount. Calls GET /api/auth/me with the browser cookie.
 * If the cookie is valid, it populates the Redux auth state so protected
 * routes and the ProtectedRoute guard work correctly on hard refreshes.
 */
function AuthHydrator({ children }) {
  const dispatch = useDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    dispatch(setLoading({ isLoading: true }));
    getMe()
      .then((data) => {
        if (data.success && data.user) {
          dispatch(login({ user: data.user, token: null }));
          // Fetch / sync cart with backend for logged-in user
          try {
            const saved = localStorage.getItem("snitch_shopping_bag_v1");
            const localItems = saved ? JSON.parse(saved) : [];
            if (localItems.length > 0) {
              dispatch(syncCart(localItems));
            } else {
              dispatch(fetchCart());
            }
          } catch {
            dispatch(fetchCart());
          }
        }
      })
      .catch(() => {
        // 401 = no valid session — that's fine, user is logged out
      })
      .finally(() => {
        dispatch(setLoading({ isLoading: false }));
        setReady(true);
      });
  }, [dispatch]);

  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#111111" }}
      >
        <p
          className="text-xs font-black uppercase tracking-widest"
          style={{ color: "#f5c518", letterSpacing: "0.2em", opacity: 0.7 }}
        >
          SNITCH
        </p>
      </div>
    );
  }

  return children;
}

function App() {
  return (
    <AuthHydrator>
      <RouterProvider router={router} />
    </AuthHydrator>
  );
}

export default App;
