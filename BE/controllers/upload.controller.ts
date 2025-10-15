import type { Request, Response, NextFunction } from "express"
import fs from "fs"
import cloudinary from "../config/cloudinary"

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

// @desc    Upload product image
// @route   POST /api/upload/product-image
// @access  Private/Admin
export const uploadProductImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      return next(new AppError("Please upload a file", 400))
    }

    // Upload to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "godswears/products",
      use_filename: true,
    })


    // Remove file from server after upload
    fs.unlinkSync(req.file.path)

    res.status(200).json({
      status: "success",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Delete product image
// @route   DELETE /api/upload/product-image/:filename
// @access  Private/Admin
export const deleteProductImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const publicId = `afro-royals/products/${req.params.filename}`

    // Delete from cloudinary
    const result = await cloudinary.uploader.destroy(publicId)

    if (result.result !== "ok") {
      return next(new AppError("Error deleting image", 400))
    }

    res.status(204).json({
      status: "success",
      data: null,
    })
  } catch (error) {
    next(error)
  }
}

