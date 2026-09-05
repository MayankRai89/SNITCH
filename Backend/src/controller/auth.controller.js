import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import SnitchModel from "../model/user.model.js";
import config from "../config/config.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLES = {
  BUYER: "buyer",
  SELLER: "seller",
};

const REDIRECT = {
  [ROLES.BUYER]: "/homepage",
  [ROLES.SELLER]: "/seller/dashboard",
};

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.sessionSecret,
    { expiresIn: "7d" }
  );
}

function setCookieAndRespond(res, user) {
  const token = signToken(user);
  const redirect = REDIRECT[user.role] ?? "/homepage";

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.status(200).json({
    success: true,
    message: `Welcome, ${user.full_name}!`,
    redirect,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    },
  });
}

// ── Register ──────────────────────────────────────────────────────────────────

export async function register(req, res) {
  try {
    // validator uses FullName — map to full_name for the DB
    const { FullName, email, mobile, password, role } = req.body;

    // Check duplicates
    const existingEmail = await SnitchModel.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ success: false, message: "Email already in use" });
    }

    const existingMobile = await SnitchModel.findByMobile(mobile);
    if (existingMobile) {
      return res.status(409).json({ success: false, message: "Mobile number already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await SnitchModel.create({
      full_name: FullName,
      email,
      mobile,
      password: hashedPassword,
      role,
    });

    return setCookieAndRespond(res, user);
  } catch (err) {
    console.error("[register] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "email and password are required" });
    }

    const user = await SnitchModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    return setCookieAndRespond(res, user);
  } catch (err) {
    console.error("[login] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logout(req, res) {
  res.clearCookie("token");
  return res.status(200).json({ success: true, message: "Logged out successfully" });
}

// ── Me (current user) ─────────────────────────────────────────────────────────

export async function me(req, res) {
  try {
    const user = await SnitchModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const { password: _pw, ...safeUser } = user;
    return res.status(200).json({ success: true, user: safeUser });
  } catch (err) {
    console.error("[me] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
// ── Google OAuth Callback ─────────────────────────────────────────────────────

const CLIENT = process.env.CLIENT_ORIGIN || "http://localhost:5173";

export function googleCallback(req, res) {
  const result = req.user;
  if (!result) {
    return res.redirect(`${CLIENT}/login?error=oauth_failed`);
  }

  // ── Returning Google user → full session ────────────────────────────────────
  if (result.type === "login") {
    const token = signToken(result.user);
    const redirect = REDIRECT[result.user.role] ?? "/homepage";
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.redirect(`${CLIENT}${redirect}`);
  }

  // ── Existing email account → demand password proof before linking ────────────
  if (result.type === "link_pending") {
    const linkToken = jwt.sign(
      {
        purpose: "google_account_link", // distinct — cannot be replayed at /complete
        google_id: result.google_id,
        email: result.email,
        full_name: result.full_name,
        userId: result.userId,
      },
      config.sessionSecret,
      { expiresIn: "10m" }
    );
    return res.redirect(
      `${CLIENT}/auth/link-account?token=${encodeURIComponent(linkToken)}`
    );
  }

  // ── Brand new user → role selection ─────────────────────────────────────────
  if (result.type === "new_user") {
    const pendingToken = jwt.sign(
      {
        purpose: "google_pending_signup", // distinct — cannot be replayed at /link
        google_id: result.google_id,
        full_name: result.full_name,
        email: result.email,
      },
      config.sessionSecret,
      { expiresIn: "10m" }
    );
    return res.redirect(
      `${CLIENT}/auth/role-select?token=${encodeURIComponent(pendingToken)}`
    );
  }

  return res.redirect(`${CLIENT}/login?error=oauth_failed`);
}

// ── Google Complete (role selection — new users) ──────────────────────────────

export const googleCompleteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests. Please try again later." },
});

export async function googleComplete(req, res) {
  try {
    const { token, role } = req.body;

    if (!token || !role) {
      return res.status(400).json({ success: false, message: "token and role are required" });
    }

    if (!["buyer", "seller"].includes(role)) {
      return res.status(400).json({ success: false, message: "role must be buyer or seller" });
    }

    // Verify and check purpose — prevents link tokens being replayed here
    let payload;
    try {
      payload = jwt.verify(token, config.sessionSecret);
    } catch {
      return res.status(401).json({ success: false, message: "Invalid or expired token. Please sign in with Google again." });
    }

    if (payload.purpose !== "google_pending_signup") {
      return res.status(400).json({ success: false, message: "Invalid token purpose." });
    }

    // Race guard: email may have been registered between callback and now
    const existing = await SnitchModel.findByEmail(payload.email);
    if (existing) {
      return setCookieAndRespond(res, existing);
    }

    const user = await SnitchModel.create({
      full_name: payload.full_name,
      email: payload.email,
      google_id: payload.google_id,
      provider: "google",
      role,
    });

    return setCookieAndRespond(res, user);
  } catch (err) {
    console.error("[googleComplete] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// ── Google Link Complete (existing email account — password confirmation) ──────

// Throttle: this endpoint accepts a password, treat it like a login endpoint
export const googleLinkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many attempts. Please try again later." },
});

export async function googleLinkComplete(req, res) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: "token and password are required." });
    }

    // Verify JWT
    let payload;
    try {
      payload = jwt.verify(token, config.sessionSecret);
    } catch {
      return res.status(401).json({
        success: false,
        message: "This link has expired. Please try signing in with Google again.",
      });
    }

    // Purpose check — prevents role-select pending tokens being replayed here
    if (payload.purpose !== "google_account_link") {
      return res.status(400).json({ success: false, message: "Invalid token." });
    }

    const user = await SnitchModel.findById(payload.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Account not found." });
    }

    // Race guard: already linked (double submit / parallel tab)
    if (user.google_id) {
      return setCookieAndRespond(res, user);
    }

    // Account has no password (created via another OAuth provider)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "This account can't be linked this way. Please contact support.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: "Incorrect password." });
    }

    // Password confirmed — now safe to link
    const updatedUser = await SnitchModel.update(user.id, {
      google_id: payload.google_id,
      provider: "google",
    });

    return setCookieAndRespond(res, updatedUser);
  } catch (err) {
    console.error("[googleLinkComplete] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

