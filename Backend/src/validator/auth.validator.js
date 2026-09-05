import { body, validationResult } from "express-validator";

function validateRequest(req, res, next) {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res
      .status(400)
      .json({ success: false, message: error.array()[0].msg });
  }
  next();
}

export const registerValidator = [
  body("FullName").trim().notEmpty().withMessage("Full name is required"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email"),
  body("mobile")
    .trim()
    .notEmpty()
    .withMessage("Mobile is required")
    .matches(/^\d{10}$/)
    .withMessage("Mobile number must be 10 digits"),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    )
    .withMessage(
      "Password must contain at least one uppercase, one lowercase, one digit, and one special character",
    ),
  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["buyer", "seller"])
    .withMessage("Role must be either 'buyer' or 'seller'"),

  validateRequest,
];

export const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email"),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required"),

  validateRequest,
];
