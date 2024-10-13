import mongoose from "mongoose";
import { BookingType, HotelType } from "../shared/types";
import cron from "node-cron";

const bookingSchema = new mongoose.Schema<BookingType>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  adultCount: { type: Number, required: true },
  childCount: { type: Number, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  userId: { type: String, required: true },
  totalCost: { type: Number, required: true },
});

const hotelSchema = new mongoose.Schema<HotelType>({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  adultCount: { type: Number, required: true },
  childCount: { type: Number, required: true },
  facilities: [{ type: String, required: true }],
  pricePerNight: { type: Number, required: true },
  starRating: { type: Number, required: true, min: 1, max: 5 },
  imageUrls: [{ type: String, required: true }],
  lastUpdated: { type: Date, required: true },
  emergency: { type: Boolean, required: true },
  status: { type: String, required: true },
  limit: { type: Number, required: true },
  bookings: [bookingSchema],
});

function dateToCronExpression(date: Date) {
  const minute = date.getMinutes();
  const hour = date.getHours();
  const dayOfMonth = date.getDate();
  const month = date.getMonth() + 1; // Months are 0-indexed in JavaScript Date object
  const dayOfWeek = date.getDay(); // 0 corresponds to Sunday

  return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
}

async function createCronJob(record: BookingType, hotelId: string) {
  try {
    const { checkOut } = record;

    // Schedule a new cron job for the checkout time
    cron.schedule(dateToCronExpression(checkOut), async () => {
      // Perform actions when the checkout time is reached
      console.log(`Checkout time reached for record with ID ${record._id}`);
      // Your update operations or any other actions here
      Hotel.updateMany({ _id: hotelId }, { $inc: { limit: 1 } });
    });

    console.log(`Cron job scheduled for record with ID ${record._id}  ${dateToCronExpression(checkOut)}`);
  } catch (error) {
    console.error('Error creating cron job:', error);
  }
}

const Hotel = mongoose.model<HotelType>("Hotel", hotelSchema);
Hotel.watch().on("change", async (change) => {
  if (change.operationType === 'update') {
    console.log("Change detected:", change.updateDescription.updatedFields);
    const bookingKey = Object.keys(change.updateDescription.updatedFields).find(key => key.startsWith('bookings.'));
    if (bookingKey) {
      const newRecord = change.updateDescription.updatedFields[bookingKey];
      await createCronJob(newRecord, change.documentKey._id);
    }
  }
});
export default Hotel;