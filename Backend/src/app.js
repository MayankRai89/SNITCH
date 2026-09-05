import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import passport from "./config/passport.js";

// ── Routes ────────────────────────────────────────────────────────────────────
import authRoutes from "./routes/auth.routes.js";
import sellerRoutes from "./routes/seller.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

const app = express();

// Trust proxy for Render / reverse proxies (enables secure cookies over HTTPS)
app.set("trust proxy", 1);

// ── Rate Limiters ──────────────────────────────────────────────────────────────

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 events per minute per IP
  message: { success: false, message: "Too many tracking requests." },
  standardHeaders: true,
  legacyHeaders: false,
});

const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // 10 checkout attempts per minute
  message: { success: false, message: "Too many checkout attempts." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".onrender.com") ||
        origin.endsWith(".netlify.app")
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for development & staging
    },
    credentials: true,          // allow cookies to be sent cross-origin
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/products", productRoutes);
// Reviews nested under products: /api/products/:productId/reviews
app.use("/api/products/:productId/reviews", reviewRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payment", paymentRoutes);

// Apply rate limiters to specific high-risk endpoints
app.use("/api/analytics/event", analyticsLimiter);
app.use("/api/orders", checkoutLimiter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "SNITCH API is running 🚀" });
});

export default app;

