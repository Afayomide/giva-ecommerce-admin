import express from "express"
import { getAllCustomers, getCustomerById, updateCustomer, getCustomerOrders } from "../controllers/customer.controller"
import { protect, restrictToAdmin } from "../middleware/auth.middleware"

const router = express.Router()

// Apply authentication middleware to all routes
router.use(protect)
router.use(restrictToAdmin)

// Get all customers
router.route("/").get(getAllCustomers)

// Get, update customer by ID
router.route("/:id").get(getCustomerById).patch(updateCustomer)

// Get customer orders
router.get("/:id/orders", getCustomerOrders)

module.exports = router;

