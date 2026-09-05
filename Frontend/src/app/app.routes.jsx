import { createBrowserRouter } from "react-router";

// Auth pages
import RegisterPage from "../feature/auth/RegisterPage";
import LoginPage from "../feature/auth/LoginPage";
import HomePage from "../feature/auth/HomePage";
import RoleSelectPage from "../feature/auth/RoleSelectPage";
import LinkAccountPage from "../feature/auth/LinkAccountPage";

// Seller pages
import SellerDashboard from "../feature/seller/page/SellerDashboard";
import SellerOnboarding from "../feature/seller/page/SellerOnboarding";
import CreateProductPage from "../feature/auth/page/createProduct";
import EditProductPage from "../feature/seller/page/EditProductPage";

// Product pages
import ProductDetailsPage from "../feature/product/page/ProductDetailsPage";

// Storefront page (public brand store)
import StorefrontPage from "../feature/seller/page/StorefrontPage";

// Buyer pages
import BuyerDashboard from "../feature/buyer/page/BuyerDashboard";

// Common pages
import NotFoundPage from "../feature/common/NotFoundPage";

// Route guard
import ProtectedRoute from "./ProtectedRoute";

export const router = createBrowserRouter([

  // ── Public Routes ───────────────────────────────────────────────────────────

  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/homepage",
    element: <HomePage />,
  },
  {
    path: "/product/:slug",
    element: <ProductDetailsPage />,
  },
  {
    path: "/p/:slug",
    element: <ProductDetailsPage />,
  },
  {
    path: "/store/:slug",
    element: <StorefrontPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },

  // ── Google OAuth callback pages ─────────────────────────────────────────────

  {
    path: "/auth/role-select",
    element: <RoleSelectPage />,
  },
  {
    path: "/auth/link-account",
    element: <LinkAccountPage />,
  },

  // ── Seller Routes (protected — seller role required) ────────────────────────

  {
    element: <ProtectedRoute role="seller" />,
    children: [
      {
        path: "/seller/dashboard",
        element: <SellerDashboard />,
      },
      {
        path: "/seller/onboarding",
        element: <SellerOnboarding />,
      },
      {
        path: "/seller/products/new",
        element: <CreateProductPage />,
      },
      {
        path: "/seller/products/edit/:id",
        element: <EditProductPage />,
      },
    ],
  },

  // ── Buyer Routes (protected — buyer role required) ──────────────────────────

  {
    element: <ProtectedRoute role="buyer" />,
    children: [
      {
        path: "/buyer/dashboard",
        element: <BuyerDashboard />,
      },
      {
        path: "/account",
        element: <BuyerDashboard />,
      },
    ],
  },

  // ── 404 Catch-all Route ─────────────────────────────────────────────────────

  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
