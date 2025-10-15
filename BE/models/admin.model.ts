import mongoose, { Document, Schema, Model } from "mongoose";

interface IAdmin extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "super-admin";
  active: boolean;
}

const adminSchema: Schema<IAdmin> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      default: "admin",
      enum: ["admin", "super-admin"],
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Admin: Model<IAdmin> = mongoose.model<IAdmin>("Admin", adminSchema);


