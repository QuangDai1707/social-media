import mongoose from "mongoose";
import { HistoryType } from "../shared/types";

const historySchema = new mongoose.Schema<HistoryType>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  adultCount: { type: Number, required: true },
  childCount: { type: Number, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  userId: { type: String, required: true },
  totalCost: { type: Number, required: true },
  name: { type: String, required: true }
});

const History = mongoose.model<HistoryType>("History", historySchema);
export default History;