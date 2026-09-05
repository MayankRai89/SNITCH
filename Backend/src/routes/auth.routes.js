import { Router } from "express";
import passport from "passport";
import rateLimit from "express-rate-limit";
import { register, login, logout, me, googleCallback, googleComplete, googleCompleteLimiter, googleLinkComplete, googleLinkLimiter } from "../controller/auth.controller.js";
import { registerValidator, loginValidator } from "../validator/auth.validator.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Throttle login/register attempts to prevent brute force (50 attempts per 15 min per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/register  — body: { name, email, mobile?, password, role: "buyer"|"seller" }
router.post("/register", authLimiter, registerValidator, register);

// POST /api/auth/login     — body: { email, password }
router.post("/login", authLimiter, loginValidator, login);

// POST /api/auth/logout
router.post("/logout", logout);

// GET  /api/auth/me        — requires valid JWT cookie
router.get("/me", authenticate, me);

// ── Google OAuth ──────────────────────────────────────────────────────────────

// Step 1: redirect user to Google's consent screen
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// Step 2: Google redirects back here after user consents
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login?error=oauth_failed" }),
  googleCallback
);

// Step 3 (new users only): user picks their role and account is created
router.post("/google/complete", googleCompleteLimiter, googleComplete);

// Step 3 (existing email accounts): confirm password then link Google ID
router.post("/google/link", googleLinkLimiter, googleLinkComplete);

export default router;

