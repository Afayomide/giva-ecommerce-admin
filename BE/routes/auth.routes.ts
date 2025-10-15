import express from "express"
import { login, logout, getMe, updatePassword } from "../controllers/auth.controller"
import { protect, restrictToAdmin } from "../middleware/auth.middleware"
import { validateLogin, validatePasswordUpdate } from "../middleware/validation.middleware"

const router = express.Router()

// Public routes - only for admin login
router.post("/login", validateLogin, login)

// Protected routes - only for admin
router.use(protect)
router.use(restrictToAdmin)
router.get("/me", getMe)
router.post("/logout", logout)
router.patch("/update-password", validatePasswordUpdate, updatePassword)

module.exports = router;

