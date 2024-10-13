import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export type UserType = {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
};
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Password is optional by default
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, required: true },
});

userSchema.pre("save", async function (next) {
  // Hash password only if it's provided and the document is being modified
  if (this.isModified("password") && this.password) {
    try {
      const hashedPassword = await bcrypt.hash(this.password, 8);
      this.password = hashedPassword;
      return next(); 
    } catch (error: any) {
      return next(error as Error); // Pass the error to the next middleware
    }
  }
  next(); 
});



const User = mongoose.model<UserType>("User", userSchema);


export default User;