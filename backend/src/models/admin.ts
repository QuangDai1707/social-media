import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export type AdminType = {
  email: string;
  password: string;
};
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

adminSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

const Admin = mongoose.model<AdminType>("Admin", adminSchema);

export default Admin;
