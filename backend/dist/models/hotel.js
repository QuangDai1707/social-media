"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const node_cron_1 = __importDefault(require("node-cron"));
const bookingSchema = new mongoose_1.default.Schema({
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
const hotelSchema = new mongoose_1.default.Schema({
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
function dateToCronExpression(date) {
    const minute = date.getMinutes();
    const hour = date.getHours();
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1; // Months are 0-indexed in JavaScript Date object
    const dayOfWeek = date.getDay(); // 0 corresponds to Sunday
    return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
}
function createCronJob(record, hotelId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { checkOut } = record;
            // Schedule a new cron job for the checkout time
            node_cron_1.default.schedule(dateToCronExpression(checkOut), () => __awaiter(this, void 0, void 0, function* () {
                // Perform actions when the checkout time is reached
                console.log(`Checkout time reached for record with ID ${record._id}`);
                // Your update operations or any other actions here
                Hotel.updateMany({ _id: hotelId }, { $inc: { limit: 1 } });
            }));
            console.log(`Cron job scheduled for record with ID ${record._id}  ${dateToCronExpression(checkOut)}`);
        }
        catch (error) {
            console.error('Error creating cron job:', error);
        }
    });
}
const Hotel = mongoose_1.default.model("Hotel", hotelSchema);
Hotel.watch().on("change", (change) => __awaiter(void 0, void 0, void 0, function* () {
    if (change.operationType === 'update') {
        console.log("Change detected:", change.updateDescription.updatedFields);
        const bookingKey = Object.keys(change.updateDescription.updatedFields).find(key => key.startsWith('bookings.'));
        if (bookingKey) {
            const newRecord = change.updateDescription.updatedFields[bookingKey];
            yield createCronJob(newRecord, change.documentKey._id);
        }
    }
}));
exports.default = Hotel;
