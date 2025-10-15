import type { Request, Response, NextFunction } from "express"
import {Admin} from "../models/admin.model"
const jwt = require("jsonwebtoken");


// Custom error class
class AppError extends Error {
  statusCode: number
  status: string
  isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error"
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}



// Protect routes - only allow authenticated users
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1) Get token and check if it exists
    let token
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1]
    }

    if (!token) {
      return next(new AppError("You are not logged in! Please log in to get access.", 401))
    }

  
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

    

    // 3) Check if admin still exists
    const currentAdmin = await Admin.findById(decoded.id)
    if (!currentAdmin) {
      return next(new AppError("The user belonging to this token no longer exists.", 401))
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentAdmin
    next()
  } catch (error) {
    next(error)
  }
}

// Restrict to admin only
export const restrictToAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "admin" && req.user?.role !== "super-admin") {
    return next(new AppError("You do not have permission to perform this action", 403))
  }

  next()
}

