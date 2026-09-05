import jwt from "jsonwebtoken";
import config from "../config/config.js";

export function authenticate(req, res, next) {
  let token = req.cookies?.token;

  // Fallback to Bearer token in Authorization header if present
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, config.sessionSecret);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: err.name === "TokenExpiredError" ? "Session expired, please login again" : "Invalid or expired token",
    });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    next();
  };
}
