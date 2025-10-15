import type { Request, Response, NextFunction } from "express"

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

// Not found middleware
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
}

// Error handler middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || "error"

  // Development error response
  if (process.env.NODE_ENV === "development") {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    })
  }
  // Production error response
  else {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      })
    } else {
      // Programming or other unknown error: don't leak error details
      console.error("ERROR 💥", err)
      res.status(500).json({
        status: "error",
        message: "Something went wrong",
      })
    }
  }
}

