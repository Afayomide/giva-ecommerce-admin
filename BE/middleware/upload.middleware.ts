import multer from "multer"
import path from "path"
import fs from "fs"
import os from "os"
import type { Request } from "express"

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

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use system temp directory for Vercel/Serverless support
    const uploadPath = path.join(os.tmpdir(), "uploads")
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
  },
})

// Check file type
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow only images
  const filetypes = /jpeg|jpg|png|webp/
  const mimetype = filetypes.test(file.mimetype)
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase())

  if (mimetype && extname) {
    return cb(null, true)
  }

  const error = new AppError("Invalid file type. Only JPEG, JPG, PNG, and WEBP files are allowed.", 400)
  cb(error)
}

// Initialize upload
export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
})

