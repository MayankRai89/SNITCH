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
  body("fullName")
    .custom((value, { req }) => {
      const name = value || req.body.FullName || req.body.name;
      if (!name || !String(name).trim()) {
        throw new Error("Full name is required");
      }
      return true;
    }),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  body("mobile")
    .custom((value, { req }) => {
      const phone = value || req.body.contactNumber;
      if (!phone || !String(phone).trim()) {
        throw new Error("Mobile is required");
      }
      if (!/^\d{10}$/.test(String(phone).trim())) {
        throw new Error("Mobile number must be 10 digits");
      }
      return true;
    }),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/)
    .withMessage(
      "Password must contain at least one uppercase, one lowercase, one digit, and one special character"
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
