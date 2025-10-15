import type { Request, Response, NextFunction } from "express";
import * as expressValidator from "express-validator";

const { body, validationResult } = expressValidator;

// Custom error class
class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Validate request
const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }
  next();
};

// Validate login
export const validateLogin = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  validateRequest,
];

// Validate password update
export const validatePasswordUpdate = [
  body("currentPassword")
    .isLength({ min: 8 })
    .withMessage("Current password must be at least 8 characters long"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long"),
  validateRequest,
];

// Validate product
export const validateProduct = [
  body("name")
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ max: 100 })
    .withMessage("Product name cannot be more than 100 characters"),
  body("description").notEmpty().withMessage("Product description is required"),
  body("price")
    .isNumeric()
    .withMessage("Price must be a number")
    .isFloat({ min: 0 })
    .withMessage("Price must be above 0"),
  body("category")
    .isIn(["Ankara", "Aso Oke", "Dansiki", "Lace"])
    .withMessage("Category must be either: Ankara, Aso Oke, Dansiki, or Lace"),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock cannot be negative"),
  validateRequest,
];

// Validate order status
export const validateOrderStatus = [
  body("status")
    .isIn(["Processing", "Shipped", "Delivered", "Cancelled"])
    .withMessage(
      "Status must be either: Processing, Shipped, Delivered, or Cancelled"
    ),
  validateRequest,
];
