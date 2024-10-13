/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Bookings related endpoints
 */


import express, { Request, Response } from "express";
import verifyToken from "../middleware/auth";
import Hotel from "../models/hotel";
import History from "../models/history";
import { HotelType } from "../shared/types";

const router = express.Router();

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
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find({
      bookings: {
        $elemMatch: { userId: req.userId, checkOut: { $gte: new Date() } },
      }
    });

    const results = hotels.map((hotel) => {
      const userBookings = hotel.bookings.filter(
        (booking) => booking.userId === req.userId
      );

      const hotelWithUserBookings: HotelType = {
        ...hotel.toObject(),
        bookings: userBookings,
      };

      return hotelWithUserBookings;
    });

    res.status(200).send(results);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to fetch bookings" });
  }
});


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
router.get("/checkout/:hotel_id", verifyToken, async (req: Request, res: Response) => {
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
    const hotel = await Hotel.updateMany({ _id: hotelId }, { $inc: { limit: 1 } });
    if (!hotel) {
      return res.status(400).json({ statusMessage: "Error occured when checkout" });
    }
    res.status(200).send({ statusMessage: "Checkout successful" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to fetch bookings" });
  }
});

export default router;