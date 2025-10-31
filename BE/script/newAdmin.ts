require("dotenv").config();
import mongoose from "mongoose";
import bcrypt from "bcrypt"; // Import bcrypt
import { Admin } from "../models/admin.model";

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://daraseyi086_db_user:yqMZZzrOtZBLGGHc@cluster0.0nhkro5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const createAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      email: "admin@dagoddesigns.com",
    });

    if (existingAdmin) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash("dmcnb&#$8dFH", 10);

    // Create new admin
    const admin = await Admin.create({
      name: "Admin User",
      email: "admin@dagoddesigns.com",
      password: hashedPassword, // Use hashed password
      role: "super-admin",
    });

    console.log("Admin user created successfully:");
    console.log(`Name: ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
};

// Run the function
createAdmin();
