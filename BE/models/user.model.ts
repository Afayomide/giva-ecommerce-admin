import mongoose, { Document, Model, Schema } from "mongoose";
import { IProduct } from "./product.model"; // Assuming you have a product interface

export interface IUser extends Document {
  fullname: string;
  email: string;
  password: string;
  cart: IProduct[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    cart: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
  },
  {
    timestamps: true, // ✅ automatically adds createdAt and updatedAt
  }
);

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);

export default User;
