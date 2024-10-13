"use strict";
/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Bookings related endpoints
 */
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
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../middleware/auth"));
const hotel_1 = __importDefault(require("../models/hotel"));
const router = express_1.default.Router();
/**
 * @swagger
 * /api/my-bookings:
 *   get:
 *     summary: Get user's bookings
 *     description: Retrieve bookings made by the authenticated user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Successfully retrieved user's bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HotelType'
 *       '500':
 *         description: Internal server error
 */
router.get("/", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hotels = yield hotel_1.default.find({
            bookings: {
                $elemMatch: { userId: req.userId, checkOut: { $gte: new Date() } },
            }
        });
        const results = hotels.map((hotel) => {
            const userBookings = hotel.bookings.filter((booking) => booking.userId === req.userId);
            const hotelWithUserBookings = Object.assign(Object.assign({}, hotel.toObject()), { bookings: userBookings });
            return hotelWithUserBookings;
        });
        res.status(200).send(results);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Unable to fetch bookings" });
    }
}));
/**
 * @swagger
 * /api/my-bookings/checkout:
 *   get:
 *     summary: Get user's check-out bookings
 *     description: Retrieve bookings made by the authenticated user with check-out date after today
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Successfully retrieved user's check-out bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HotelType'
 *       '500':
 *         description: Internal server error
 */
router.get("/checkout/:hotel_id", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const hotels = await Hotel.find({
        //   bookings: {
        //     $elemMatch: { userId: req.userId, checkOut: { $gte: new Date() } },
        //   }
        // });
        // const results = hotels.map((hotel) => {
        //   const userBookings = hotel.bookings.filter(
        //     (booking) => booking.userId === req.userId
        //   );
        //   const hotelWithUserBookings: HotelType = {
        //     ...hotel.toObject(),
        //     bookings: userBookings,
        //   };
        //   return hotelWithUserBookings;
        // });
        const hotelId = req.params.hotel_id;
        const hotel = yield hotel_1.default.updateMany({ _id: hotelId }, { $inc: { limit: 1 } });
        if (!hotel) {
            return res.status(400).json({ statusMessage: "Error occured when checkout" });
        }
        res.status(200).send({ statusMessage: "Checkout successful" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Unable to fetch bookings" });
    }
}));
exports.default = router;
