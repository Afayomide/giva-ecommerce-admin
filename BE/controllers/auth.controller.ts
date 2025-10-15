import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import {Admin} from "../models/admin.model"

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

// Generate JWT token
const signToken = (id: string): string => {
  
  return jwt.sign({ id }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: "30d",
  })
}

// Send JWT token in response
const createSendToken = (admin: any, statusCode: number, res: Response): void => {
  const token = signToken(admin._id)

  admin.password = undefined

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      admin,
    },
  })
}

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body

    const admin = await Admin.findOne({ email }).select("+password")

    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return next(new AppError("Incorrect email or password", 401))
    }

    createSendToken(admin, 200, res)
  } catch (error) {
    next(error)
  }
}

// @desc    Logout admin
// @route   POST /api/auth/logout
// @access  Private/Admin
export const logout = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  })
}

// @desc    Get current logged in admin
// @route   GET /api/auth/me
// @access  Private/Admin
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Admin is already available in req due to the protect middleware
    res.status(200).json({
      status: "success",
      data: {
        admin: req.user,
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Update password
// @route   PATCH /api/auth/update-password
// @access  Private/Admin
export const updatePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const currentPassword = req.body.currentPassword
  try {
    const admin = await Admin.findById(req.user?._id).select("+password")

    if (!admin) {
      return next(new AppError("Admin not found", 404))
    }

    if (!bcrypt.compareSync(currentPassword, admin.password)) {
      return next(new AppError("Your current password is incorrect", 401))
    }

    admin.password = req.body.newPassword
    await admin.save()

    createSendToken(admin, 200, res)
  } catch (error) {
    next(error)
  }
}

