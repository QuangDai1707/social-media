import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export type EmergencyType = {
  id: string;
  isEmergency: boolean;
};
const emergencySchema = new mongoose.Schema({
  isEmergency: { type: Boolean, required: true },
});

const Emergency = mongoose.model<EmergencyType>("Emergency", emergencySchema);

export default Emergency;